---
ruleId: "@sheng/no-static-px-inline-style"
ruleName: "no-static-px-inline-style"
config: "project-style"
---

# @sheng/no-static-px-inline-style

提示 Vue 组件不要把固定 px 样式写成 :style 绑定对象。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

提示 Vue 组件不要把固定 `px` 样式写成 `:style` 绑定对象。

固定尺寸优先放在组件 class / BEM 选择器里，并尽量用项目已有的 CSS 工具表达，例如 TailwindCSS `@apply`、CSS Modules 或 scoped style。脚本里的 style object 应只保留真实动态值。需要运行期变量时，优先使用 CSS 变量或 CSS `v-bind()`，不要把一组固定 `height / padding / gap / borderRadius` 长期留在 JS。

当前规则先作为候选规则和单测样例保留，暂不接入默认 ESLint 配置。

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
