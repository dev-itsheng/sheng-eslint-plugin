---
ruleId: "@sheng/no-static-px-inline-style"
ruleName: "no-static-px-inline-style"
config: "component-resource-style"
---

# @sheng/no-static-px-inline-style

提示 Vue 组件不要把固定 px 样式写成 :style 绑定对象。

## 所属 config

- `component-resource-style`：组件 DOM owner、静态样式和静态资源 import 的项目约定。

提示 Vue 组件不要把固定 `px` 样式写成 `:style` 绑定对象。

固定尺寸优先放在组件 class / BEM 选择器里，并尽量用项目已有的 CSS 工具表达，例如 TailwindCSS `@apply`、CSS Modules 或 scoped style。脚本里的 style object 应只保留真实动态值。需要运行期变量时，优先使用 CSS 变量或 CSS `v-bind()`，不要把一组固定 `height / padding / gap / borderRadius` 长期留在 JS。

固定 `px` style object 看起来只是写法差异，实际会把静态视觉约束藏进脚本层。后续改样式、做响应式、统一 BEM 或迁移 CSS 工具时，维护者很难从样式文件里看到完整视觉规则。

## 会提示

```vue
<script setup>
const buttonStyle = {
  height: '44px',
  paddingLeft: '12px',
}
</script>

<template>
  <button :style="buttonStyle" />
</template>
```

```vue
<template>
  <img :style="{ width: '24px', height: '24px' }" />
</template>
```

## 不提示

```vue
<style scoped>
.button {
  @apply h-11 px-4;
}
</style>
```

```vue
<template>
  <div :style="{ '--avatar-color': color }" />
</template>
```

运行时变量生成的尺寸也可以继续通过 CSS 变量或 `v-bind()` 传给样式层。规则要挡的是“长期固定不变的视觉值”，不是阻止所有动态样式。

## 例外处理

第三方 SDK 容器、外部宿主限制、临时兼容层可能确实只能通过行内样式写固定值。建议通过 `ignoredPathPatterns` 精确放行这些路径，不要把例外写进规则源码。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：固定尺寸长期放在 JS style object 里，会把静态视觉约束藏进脚本层；固定值应该回到 class、BEM、scoped style 或 Tailwind `@apply`，脚本里的 `:style` 只保留真实动态值。

## 在线试一下

<RuleDemo rule="no-static-px-inline-style" />

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
      '@sheng/no-static-px-inline-style': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-static-px-inline-style/index.mjs`
- 规则短说明：`src/rules/no-static-px-inline-style/README.md`
- 测试用例：`tests/unit/architecture/`
