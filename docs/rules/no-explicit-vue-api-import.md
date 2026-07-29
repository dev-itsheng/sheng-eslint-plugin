---
ruleId: "@sheng/no-explicit-vue-api-import"
ruleName: "no-explicit-vue-api-import"
config: "nuxt-auto-import"
---

# @sheng/no-explicit-vue-api-import

提示 Vue 运行时 API 在 Nuxt SFC / app 代码里应使用自动导入，类型 import 仍允许显式保留。

## 所属 config

- `nuxt-auto-import`：Nuxt 组件和 Vue API 自动导入约定。

提示在 Nuxt `app/**` 代码里不要从 `vue` 显式 import 运行时 API。

当前先做 warn，不做 autofix。原因是同一行里可能混有 `computed` 这类运行时 API 和 `Ref` 这类类型 import；规则只指出应该移除的 value import，实际拆行需要人或 Agent review。

## 规则

- `computed`、`ref`、`watch`、生命周期 hook 等 Nuxt 已自动导入的运行时 API 会提示。
- `import type { Ref } from 'vue'` 这类类型 import 不提示。
- `import { computed, type Ref } from 'vue'` 只提示 `computed`。
- 支持 `ignoredPathPatterns`，用于先放过不属于当前 owner 的历史模块或迁移中的旧目录。

## 推荐写法

```ts
import type { Ref } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
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
      '@sheng/no-explicit-vue-api-import': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-explicit-vue-api-import/index.mjs`
- 规则短说明：`src/rules/no-explicit-vue-api-import/README.md`
- 测试用例：`tests/unit/architecture/`
