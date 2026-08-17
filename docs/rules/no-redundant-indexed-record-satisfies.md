---
ruleId: "@sheng/no-redundant-indexed-record-satisfies"
ruleName: "no-redundant-indexed-record-satisfies"
config: "type-readability"
---

# @sheng/no-redundant-indexed-record-satisfies

提示完整 Record 映射表被立即索引时去掉冗余 satisfies。

## 所属 config

- `type-readability`：TypeScript 运行时值、映射表和轻量 computed 的可读性约定。

完整对象字面量映射表如果创建后马上用 `[key]` 读取，不需要再套 `satisfies Record<...>`。这种写法会让简单的 key/value 映射变得更绕，也容易让读者误以为这里必须依赖额外的类型拓宽。

这个规则处理的是“立即索引”的场景。对象字面量刚写完就被 `[activeKey]` 读取，读者关心的是这一次映射结果，而不是拿到一张可复用的完整表。多套类型标注叠在一起，通常只会让简单表达式显得更重。

## 会提示

```ts
const value = (
  {
    [Tab.Overview]: commonValue,
    [Tab.Billing]: diamondValue,
  } satisfies Record<Tab, string>
)[activeTab]
```

## 推荐

```ts
const value = {
  [Tab.Overview]: commonValue,
  [Tab.Billing]: diamondValue,
}[activeTab]
```

## 不会提示

部分映射仍然需要显式表达“不是每个 key 都有值”，否则 TypeScript 会把对象窄化成当前列出的 key：

```ts
const value = (
  {
    [TaskType.Chat]: chatRule,
  } satisfies Partial<Record<TaskType, string>>
)[taskType]
```

`Record<string, ...>` 这类开放 key 也不提示，因为去掉 `satisfies` 后可能失去索引签名。

## 不自动修复

规则暂时不提供 autofix。`satisfies` 附近可能有注释、格式化意图或类型推断边界，自动删除容易让 diff 难读。命中后建议人工确认这张表确实只是立即索引，再去掉冗余标注。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：完整 `Record` 映射表如果创建后马上索引读取，再套一层 `satisfies Record<...>` 往往只是在增加类型噪音；这类规则也不适合第一版就做 autofix。

## 在线试一下

<RuleDemo rule="no-redundant-indexed-record-satisfies" />

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
      '@sheng/no-redundant-indexed-record-satisfies': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-redundant-indexed-record-satisfies/index.mjs`
- 规则短说明：`src/rules/no-redundant-indexed-record-satisfies/README.md`
- 测试用例：`tests/unit/architecture/`
