---
ruleId: "@sheng/no-component-name-conflict"
ruleName: "no-component-name-conflict"
config: "vue-script-setup"
---

# @sheng/no-component-name-conflict

避免 Vue `<script setup>` 中组件 tag 或自定义指令名和顶层绑定只靠大小写区分，导致模板解析到错误对象。

## 所属 config

- `vue-script-setup`：Vue `<script setup>` 宏和模板名称解析边界。

这条规则用于发现 `<script setup>` 里的组件 import、局部指令和普通顶层绑定只靠大小写区分，导致模板里的 kebab-case 组件 tag 或自定义指令名被 Vue 编译器解析到错误对象。

## 会被提示的写法

```vue
<template>
  <popup-status :message="popupStatus.message" />
</template>

<script setup lang="ts">
import { PopupStatus } from './components'

const popupStatus = {
  message: 'Saved',
}
</script>
```

`<popup-status>` 会生成 `popupStatus` 和 `PopupStatus` 两个候选名。当前规则发现同一个 SFC 里同时存在普通绑定 `popupStatus` 和组件候选 `PopupStatus`，并且模板写法会优先命中普通绑定，于是给出诊断。

自定义指令也有相邻风险。Vue 编译 `v-popup-status` 时会按 `v-popup-status`、`vPopupStatus`、`VPopupStatus` 这组候选名解析 `<script setup>` 顶层绑定。如果同一个 SFC 里同时存在 `vPopupStatus` 和 `VPopupStatus`，模板指令名的归一化结果就不再唯一。

```vue
<template>
  <input v-popup-status />
</template>

<script setup lang="ts">
import { VPopupStatus } from './directives'

const vPopupStatus = {
  mounted() {},
}
</script>
```

## 推荐写法

```vue
<template>
  <popup-status :message="popupFeedback.message" />
</template>

<script setup lang="ts">
import { PopupStatus } from './components'

const popupFeedback = {
  message: 'Saved',
}
</script>
```

也可以把组件 tag 写成 PascalCase，或给组件 import 起别名。但多数情况下，状态变量应该改成更具体的业务名。

## 边界

- 只检查 `.vue` 文件里的 `<script setup>`。
- 只在模板里真的出现会歧义解析的组件 tag 或自定义指令名时提示。
- type-only import、命名空间 import、内置标签和 HTML 标签会跳过。
- 内置指令会跳过，例如 `v-if`、`v-for`、`v-show`、`v-model`、`v-on`、`v-bind`。
- 静态事件名不会检查。`@save-user` 会编译成事件 prop key，不会把事件名本身拿去 `<script setup>` 里查 `saveUser` / `SaveUser` 候选。
- 默认不提供 autofix。重命名状态变量、改组件 tag、或给组件 import 起别名都可能是合理修复，规则不应该替项目自动选择。

## 相关阅读

这条规则对应中文文章 [Vue script setup 中组件静默消失的原因：一次命名冲突排查](https://shengsheng.fun/2026/05/26/vue-script-setup-component-name-conflict/)。文章里的核心结论是：模板里的 kebab-case 组件 tag 会归一化出 camelCase 和 PascalCase 候选，并进入 `<script setup>` 顶层绑定解析；普通变量和组件 import 只靠大小写区分时，模板可能先命中普通变量。文章也补充了同源风险：自定义指令名同样会生成 `vXxx` / `VXxx` 候选。

## 在线试一下

<RuleDemo rule="no-component-name-conflict" />

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
      '@sheng/no-component-name-conflict': 'warn',
    },
  },
]
```

这条规则命中时，组件或自定义指令已经存在稳定解析歧义，业务项目确认 parser 配置正常后，建议把它覆写成 `error`：

```js
export default [
  sheng.configs['vue-script-setup'],
  {
    rules: {
      '@sheng/no-component-name-conflict': 'error',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-component-name-conflict/index.mjs`
- 规则短说明：`src/rules/no-component-name-conflict/README.md`
- 测试用例：`tests/unit/architecture/`
