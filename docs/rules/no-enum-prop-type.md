---
ruleId: "@sheng/no-enum-prop-type"
ruleName: "no-enum-prop-type"
config: "enum-public-api"
---

# @sheng/no-enum-prop-type

提醒少数需要 string-compatible 调用面的 Vue props 不要直接暴露指定 enum 类型。

## 所属 config

- `enum-public-api`：公开字符串调用面里的 enum 使用边界。

提醒少数需要 string-compatible 调用面的 Vue props 不要直接暴露指定 enum 类型。

这条规则必须通过 `disallowedEnumNames` 显式配置 enum 名。它不会默认禁止所有 enum props，因为内部组件和封闭状态直接用 enum 是合理的。

## 错误示例

```vue
<script setup lang="ts">
const enum DialogMode {
  Prompt = 'prompt',
}

defineProps<{
  mode: DialogMode
}>()
</script>
```

## 正确示例

```vue
<script setup lang="ts">
const enum DialogMode {
  Prompt = 'prompt',
}

type DialogModeValue = `${DialogMode}`

defineProps<{
  mode: DialogModeValue
}>()
</script>
```

## 相关阅读

这条规则对应中文文章 [用 const enum 和字符串值类型保留公开 API 的自然写法](https://shengsheng.fun/2026/07/14/const-enum-string-value-type/)。文章里的核心判断是：公开 Vue prop 常常应该保留 `mode="prompt"` 这样的字符串调用面；内部可以用 `const enum` 提供命名锚点，再用 `` `${Enum}` `` 得到字符串值类型。规则只提醒显式配置的公开 enum，不把“所有 enum prop 都不行”当成全仓口味。

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
      '@sheng/no-enum-prop-type': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-enum-prop-type/index.mjs`
- 规则短说明：`src/rules/no-enum-prop-type/README.md`
- 测试用例：`tests/unit/architecture/`
