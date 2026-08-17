---
ruleId: "@sheng/no-dom-query-in-component"
ruleName: "no-dom-query-in-component"
config: "component-resource-style"
---

# @sheng/no-dom-query-in-component

提示组件和页面不要用 DOM 查找 API，优先使用 template ref 或 function ref。

## 所属 config

- `component-resource-style`：组件 DOM owner、静态样式和静态资源 import 的项目约定。

组件和页面里不要直接调用 `querySelector`、`getElementById` 这类 DOM 查找 API。

这些选择器依赖 class、data attribute 或全局 id，一旦拆组件、重命名 BEM、Teleport 或重复渲染多份弹窗，就容易找错节点。优先使用 Vue 的 template ref、function ref 或子组件 emit 把真实元素引用显式交给 composable。

这条规则关注的是 DOM owner。元素如果属于当前组件模板，引用关系应该留在模板结构里；元素如果属于子组件，父组件应该通过组件公开方法、事件或明确的 ref 协议拿到能力，而不是向下查内部 DOM。

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

## 例外处理

第三方 SDK 容器、外部宿主 DOM、遗留页面挂载点这类场景，可能确实只能查全局节点。遇到这些代码时不要扩大默认放行范围，优先把路径放进 `ignoredPathPatterns`，并在对应代码附近说明它为什么不能改成 template ref。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：组件里的 DOM owner 应该尽量留在模板结构里，单节点用 template ref，列表节点用 function ref，子组件内部节点通过 emit 或公开方法交给父层。

## 在线试一下

<RuleDemo rule="no-dom-query-in-component" />

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
