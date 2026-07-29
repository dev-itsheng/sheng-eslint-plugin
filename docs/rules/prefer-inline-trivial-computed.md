---
ruleId: "@sheng/prefer-inline-trivial-computed"
ruleName: "prefer-inline-trivial-computed"
config: "project-style"
---

# @sheng/prefer-inline-trivial-computed

提示不要用 computed 只包一层静态 i18n 调用或简单模板 class map。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

提示不要用 `computed()` 只包一层静态 i18n 调用或简单模板 class map。

这类 computed 看起来统一，实际没有额外派生逻辑，还会把模板状态和 DOM 之间的关系拉远。规则只做提醒，不做 autofix。

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
