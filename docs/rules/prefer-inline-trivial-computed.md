---
ruleId: "@sheng/prefer-inline-trivial-computed"
ruleName: "prefer-inline-trivial-computed"
config: "type-readability"
---

# @sheng/prefer-inline-trivial-computed

提示不要用 computed 只包一层静态 i18n 调用或简单模板 class map。

## 所属 config

- `type-readability`：TypeScript 运行时值、映射表和轻量 computed 的可读性约定。

提示不要用 `computed()` 只包一层静态 i18n 调用或简单模板 class map。

这类 computed 看起来统一，实际没有额外派生逻辑，还会把模板状态和 DOM 之间的关系拉远。规则只做提醒，不做 autofix。

Agent 很容易为了“看起来规整”把每个模板表达式都先抽成 computed。静态 i18n 调用和简单 class map 放在模板里更直接，读者能在模板附近看到文案和状态到 class 的关系。

## 会提示

```ts
const titleText = computed(() => t('string_save'))
const rootClasses = computed(() => ({
  'profile-card--active': active.value,
  'profile-card--locked': !available.value,
}))
```

## 推荐

```html
<template>
  <h2>{{ t('string_save') }}</h2>
  <article :class="{ 'profile-card--active': active, 'profile-card--locked': !available }" />
</template>
```

如果 computed 里有真实格式化、跨节点复用或复杂派生逻辑，规则不会提示。

## 保留 computed 的情况

如果表达式被多个地方复用、包含实际格式化、需要缓存昂贵计算、或者封装了跨节点共享的派生状态，就应该继续使用 computed。这条规则只处理“包一层但没有新增语义”的轻量场景。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：`computed()` 只包一层静态 i18n 调用或简单 class map 时，容易制造「这里有状态派生」的错觉；静态文案和轻量模板 class 通常放回模板更直接。

## 在线试一下

<RuleDemo rule="prefer-inline-trivial-computed" />

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
      '@sheng/prefer-inline-trivial-computed': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/prefer-inline-trivial-computed/index.mjs`
- 规则短说明：`src/rules/prefer-inline-trivial-computed/README.md`
- 测试用例：`tests/unit/architecture/`
