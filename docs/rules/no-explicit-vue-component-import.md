---
ruleId: "@sheng/no-explicit-vue-component-import"
ruleName: "no-explicit-vue-component-import"
config: "nuxt-auto-import"
---

# @sheng/no-explicit-vue-component-import

提示 Nuxt 组件应使用自动导入名，避免在组件和页面里显式 import .vue 组件。

## 所属 config

- `nuxt-auto-import`：Nuxt 组件和 Vue API 自动导入约定。

提示在 Nuxt 组件体系里不要显式 import `.vue` 组件。

当前先做 warn，不做 autofix。原因是组件名从路径推导出来之后，模板标签也要一起改；这一步需要人或 Agent review 组件路径是否已经足够语义化，不能靠规则静默改。

组件名推导必须对齐 Nuxt 4 的真实算法：路径前缀和文件名会按大小写拆段，并移除重复片段。例如
`app/components/common/User/Profile/Record/RecordRow.vue` 的自动导入名是
`CommonUserProfileRecordRow`，不是 `CommonUserProfileRecordRecordRow`。
如果不确定，先看 `.nuxt/components.d.ts`，或跑 `tests/unit/architecture/nuxt-auto-import-component-usage.test.ts`。

## 规则

- `app/components/**` 里，相对路径 import `.vue` 会提示。
- `app/pages/**` 里，import `app/components/**` 下的 `.vue` 会提示。
- 支持 `ignoredPathPatterns`，用于先放过不属于当前 owner 的历史模块或迁移中的旧目录。

## 推荐写法

```vue
<script setup lang="ts">
// 不需要 import CommonUserProfileCard
</script>

<template>
  <CommonUserProfileCard />
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
      '@sheng/no-explicit-vue-component-import': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-explicit-vue-component-import/index.mjs`
- 规则短说明：`src/rules/no-explicit-vue-component-import/README.md`
- 测试用例：`tests/unit/architecture/`
