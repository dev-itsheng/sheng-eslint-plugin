---
ruleId: "@sheng/no-redundant-indexed-record-satisfies"
ruleName: "no-redundant-indexed-record-satisfies"
config: "project-style"
---

# @sheng/no-redundant-indexed-record-satisfies

提示完整 Record 映射表被立即索引时去掉冗余 satisfies。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

完整对象字面量映射表如果创建后马上用 `[key]` 读取，不需要再套 `satisfies Record<...>`。这种写法会让简单的 key/value 映射变得更绕，也容易让读者误以为这里必须依赖额外的类型拓宽。

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
