---
ruleId: "@sheng/no-dom-query-in-component"
ruleName: "no-dom-query-in-component"
config: "project-style"
---

# @sheng/no-dom-query-in-component

提示组件和页面不要用 DOM 查找 API，优先使用 template ref 或 function ref。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

组件和页面里不要直接调用 `querySelector`、`getElementById` 这类 DOM 查找 API。

这些选择器依赖 class、data attribute 或全局 id，一旦拆组件、重命名 BEM、Teleport 或重复渲染多份弹窗，就容易找错节点。优先使用 Vue 的 template ref、function ref 或子组件 emit 把真实元素引用显式交给 composable。

## 正确

```vue
<script setup lang="ts">
const buttonRef = shallowRef<HTMLElement | null>(null)
</script>

<template>
  <button ref="buttonRef" />
</template>
```

列表场景使用 function ref：

```vue
<script setup lang="ts">
const itemRefs = shallowRef<Record<number, HTMLElement | null>>({})

function setItemRef(value: Element | null, index: number) {
  itemRefs.value = {
    ...itemRefs.value,
    [index]: value instanceof HTMLElement ? value : null,
  }
}
</script>

<template>
  <button v-for="(item, index) in items" :ref="(value) => setItemRef(value, index)" />
</template>
```

## 错误

```ts
const activeNode = root.value?.querySelector('[data-active]')
const dialog = document.getElementById('dialog')
```

## 配置

规则默认检查 `querySelector`、`querySelectorAll`、`getElementById`、`getElementsByClassName`、`getElementsByName`、`getElementsByTagName`。

第三方 SDK 或必须操作全局宿主 DOM 的路径可以通过 `ignoredPathPatterns` 精确放行，不要在规则源码里写死业务例外。

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
      '@sheng/no-dom-query-in-component': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-dom-query-in-component/index.mjs`
- 规则短说明：`src/rules/no-dom-query-in-component/README.md`
- 测试用例：`tests/unit/architecture/`
