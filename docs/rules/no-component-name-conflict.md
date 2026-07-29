---
ruleId: "@sheng/no-component-name-conflict"
ruleName: "no-component-name-conflict"
config: "vue-script-setup"
---

# @sheng/no-component-name-conflict

避免 Vue <script setup> 中组件 import 和普通顶层绑定只靠大小写区分，导致 kebab-case 组件 tag 被解析到普通绑定。

## 所属 config

- `vue-script-setup`：Vue `<script setup>` 宏和组件命名边界。

这条规则用于发现 `<script setup>` 里的组件 import 和普通顶层绑定只靠大小写区分，导致模板里的 kebab-case 组件 tag 被 Vue 编译器解析到普通绑定。

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
- 只在模板里真的出现会歧义解析的 tag 时提示。
- type-only import、命名空间 import、内置标签和 HTML 标签会跳过。
- 默认不提供 autofix。重命名状态变量、改组件 tag、或给组件 import 起别名都可能是合理修复，规则不应该替项目自动选择。

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

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-component-name-conflict/index.mjs`
- 规则短说明：`src/rules/no-component-name-conflict/README.md`
- 测试用例：`tests/unit/architecture/`
