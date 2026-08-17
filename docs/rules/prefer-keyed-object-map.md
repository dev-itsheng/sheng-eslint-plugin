---
ruleId: "@sheng/prefer-keyed-object-map"
ruleName: "prefer-keyed-object-map"
config: "type-readability"
---

# @sheng/prefer-keyed-object-map

提醒同一个离散 key 的分支优先改成对象字面量 + key 映射。

## 所属 config

- `type-readability`：TypeScript 运行时值、映射表和轻量 computed 的可读性约定。

提醒同一个离散 key 的分支优先改成对象字面量 + key 映射。

这条规则只做提醒，不做 autofix。原因是对象字面量会先计算所有 value，如果分支里有函数调用、埋点、请求、弹窗等副作用，自动改写会改变执行时机。遇到这种场景应该改成函数映射，或者保留当前三元 / `if` / `switch`。

适合这条规则的场景有一个共同点：所有分支都在比较同一个离散状态，而且每个分支只是返回一个值。对象映射能把“状态 -> 结果”的关系放到同一张表里，读者不用在连续三元、`if` 链或 `switch` 之间来回追。

## 触发场景

```ts
const label = status === Status.Ready ? 'Ready' : status === Status.Error ? 'Error' : 'Unknown'
```

```ts
function getIcon(type: IconType) {
  if (type === IconType.Coin) return coinSrc
  if (type === IconType.Billing) return pointsSrc
  return fallbackSrc
}
```

建议写成：

```ts
const label =
  {
    [Status.Ready]: 'Ready',
    [Status.Error]: 'Error',
  }[status] ?? 'Unknown'
```

如果分支值需要按需计算：

```ts
const message = (() => {
  const formatter = {
    [Status.Ready]: () => buildReadyMessage(detail),
    [Status.Error]: () => buildErrorMessage(error),
  }[status]

  return formatter?.() ?? buildUnknownMessage()
})()
```

## 不触发场景

连续阈值、布尔判断、单个二分支兜底通常继续用三元表达式：

```ts
const text = count > 0 ? '有内容' : '暂无内容'
const text = enabled ? '已开启' : '已关闭'
const text = status === Status.Ready ? 'Ready' : 'Unknown'
function getText(status: Status) {
  if (status === Status.Ready) return 'Ready'
  return 'Unknown'
}
```

如果 ESLint 当前运行环境提供 TypeScript parser services，且判别值能被识别为封闭二值 union / enum，单个 `x === A ? b : c` 或 `if (x === A) return b; return c` 也会提示。此时 `c` 很可能代表另一个固定状态，而不是开放兜底。

## 不自动修复

规则不会自动把分支改成对象字面量。对象 value 的求值时机和 `if` / 三元分支不同；如果 value 里有函数调用、副作用或昂贵计算，自动修复可能改变行为。Lint 只负责提示结构，最终改成值映射、函数映射，还是保留分支，由开发者按上下文决定。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：多分支都在比较同一个离散 key 时，对象映射通常比连续三元、`if` 链或 `switch` 更容易扫读；但 value 里有副作用或昂贵计算时，应该改成函数映射或保留分支。

## 在线试一下

<RuleDemo rule="prefer-keyed-object-map" />

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
      '@sheng/prefer-keyed-object-map': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/prefer-keyed-object-map/index.mjs`
- 规则短说明：`src/rules/prefer-keyed-object-map/README.md`
- 测试用例：`tests/unit/architecture/`
