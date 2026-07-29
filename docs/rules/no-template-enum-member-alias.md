---
ruleId: "@sheng/no-template-enum-member-alias"
ruleName: "no-template-enum-member-alias"
config: "enum-public-api"
---

# @sheng/no-template-enum-member-alias

提示 Vue template 可以直接使用 script setup 里的 enum member，不需要额外声明一比一中转常量。

## 所属 config

- `enum-public-api`：公开字符串调用面里的 enum 使用边界。

提示 Vue template 可以直接使用 `<script setup>` 里的 enum member，不需要额外声明一比一中转常量。

## 错误示例

```vue
<script setup lang="ts">
const enum DialogMode {
  Confirm = 'confirm',
}

const confirmMode = DialogMode.Confirm
</script>

<template>
  <CommonDialog :mode="confirmMode" />
</template>
```

## 正确示例

```vue
<script setup lang="ts">
const enum DialogMode {
  Confirm = 'confirm',
}
</script>

<template>
  <CommonDialog :mode="DialogMode.Confirm" />
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
      '@sheng/no-template-enum-member-alias': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-template-enum-member-alias/index.mjs`
- 规则短说明：`src/rules/no-template-enum-member-alias/README.md`
- 测试用例：`tests/unit/architecture/`
