---
ruleId: "@sheng/no-native-string-user-text-ops"
ruleName: "no-native-string-user-text-ops"
config: "unicode-user-text"
---

# @sheng/no-native-string-user-text-ops

禁止在用户可见文本里直接使用原生字符串长度 / 截断 API，避免 UTF-16 code unit 计数和切片误伤 emoji、国旗和组合字符。

## 所属 config

- `unicode-user-text`：用户可见文本的 Unicode 字符数和截断护栏。

## 背景

JavaScript 的 `String.length` 统计的是 UTF-16 code unit，不是用户眼里的“一个字”。这会让用户可见文本出现明显错误：

- 一个 emoji 可能被算成 2。
- 国旗由两个 regional indicator 组成，`length` 可能是 4。
- ZWJ 家庭 emoji、肤色修饰 emoji、组合音标、Indic conjunct 等会被拆成多个 code unit 或 code point。
- `slice()` / `substring()` 可能把一个用户感知字符切断，导致显示乱码或半个 emoji。

项目里资料昵称、签名、举报原因、输入框计数等都应该按用户感知字符处理，而不是按 UTF-16 code unit 处理。

这条规则就是为了防止新增代码继续使用原生字符串长度 / 截断能力处理用户可见文本。

## 检查范围

规则主要检查三类场景：

- 对用户可见文本读 `.length`。
- 对用户可见文本调用 `charAt`、`slice`、`substring`、`substr`。
- 在 `<input>` / `<textarea>` 上使用原生 `maxlength` 限制用户可见文本。

规则不是“所有字符串都不能用原生 API”。它会结合变量名、函数名、调用链、TypeScript 类型和 Vue ref 类型判断目标是不是用户可见文本。

## 会提示

```ts
const nickname = ref('👨‍👩‍👧‍👦')

const count = nickname.value.length
const preview = nickname.value.slice(0, 10)
```

```vue
<template>
  <input v-model="nickname" maxlength="20" />
</template>
```

## 推荐替代

统一使用 `shared/utils/unicodeText/` 里的工具：

- 统计长度：`countUnicodeCharacters(value)`
- 判断空白：`isUnicodeTextBlank(value)`
- 判断超限：`isUnicodeTextOverLimit(value, max)`
- 截断：`truncateUnicodeCharacters(value, max)`
- 切片：`sliceUnicodeCharacters(value, start, end)`
- 保留 `substring()` 起止交换语义：`substringUnicodeCharacters(value, start, end)`
- 取单个用户感知字符：`getUnicodeCharacterAt(value, index)`

如果只是限制输入最大长度，不要依赖原生 `maxlength`：

```vue
<script setup lang="ts">
function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  model.value = truncateUnicodeCharacters(input.value, 20)
}
</script>

<template>
  <input :value="model" @input="handleInput" />
</template>
```

## 技术字符串例外

以下语义通常是技术字符串，可以继续使用原生长度或切片：

- `uid` / `id` / `did`
- token / cookie / hash / md5 / uuid
- path / url / href
- phone / password / otp / code
- byte / buffer / base64 / hex

默认名单在 `constants.js` 里维护。项目特殊技术字段可以通过 `technicalNamePatterns` 扩展，例如 `sku`、`serial`、`checksum`。

## 用户文本识别

规则会优先识别这些用户可见文本语义：

- nickname
- remark
- description
- signature
- title
- content
- message
- label
- placeholder
- search / keyword / query
- reason / feedback

默认名单也在 `constants.js` 里维护。新增业务领域如果有稳定的用户文本命名，可以通过 `userTextNamePatterns` 扩展。

## 误报处理

如果某个场景确实需要原生 UTF-16 长度或原生字符串下标语义，允许局部禁用，但必须写清楚原因：

```ts
// eslint-disable-next-line @sheng/no-native-string-user-text-ops -- token 按协议固定字节/ASCII 长度校验，不是用户可见文本。
if (token.length !== TOKEN_LENGTH) return false
```

不要为了省事在文件头关闭整条规则。

## 维护方式

- 新增被禁止的原生方法时，同时在 `constants.js` 里补替代建议。
- 新增技术词 / 用户文本词时，优先补单测，确认不会造成大面积误报。
- 如果某个新输入组件不是 `<input>` / `<textarea>`，但也有原生最大长度限制，先补规则测试再扩展 AST 检查。

## 对应测试

测试文件是 `tests/unit/architecture/no-native-string-user-text-ops-rule.test.ts`。这条规则涉及 Unicode 边界，新增 case 时尽量把 emoji、国旗、组合字符和技术字符串例外都覆盖到。

## 相关阅读

这条规则对应中文文章 [别再用 length 统计用户文本：一次 Unicode 字符数和 ESLint 护栏复盘](https://shengsheng.fun/2026/07/03/unicode-grapheme-text-count-eslint-guardrail/)。文章里的核心结论是：产品里的“一个字”更接近 Unicode grapheme cluster；JavaScript 原生字符串 API 统计的是 UTF-16 code unit，容易数错 emoji、国旗、组合字符，也可能把一个用户感知字符切断。

## 接入方式

`@sheng/eslint-plugin` 的内置 config 会以 `warn` 开启这条规则。需要单独配置时，可以这样写：

```js
import sheng from '@sheng/eslint-plugin'

export default [
  {
    plugins: {
      '@sheng': sheng,
    },
    rules: {
      '@sheng/no-native-string-user-text-ops': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-native-string-user-text-ops/index.mjs`
- 规则短说明：`src/rules/no-native-string-user-text-ops/README.md`
- 测试用例：`tests/unit/architecture/`
