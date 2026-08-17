# 配置

内置 config 都是 ESLint flat config 片段，只注册 `@sheng` 插件并以 `warn` 开启对应规则。它们不设置 parser、globals、ignores 或 formatter。

| 配置 | 规则数 | 说明 |
| --- | ---: | --- |
| `all` | 27 | 当前全部 ESLint rule，适合本地试跑或 CI 观察期。 |
| `vue-script-setup` | 2 | Vue `<script setup>` 宏和模板名称解析边界。 |
| `i18n` | 3 | 翻译 key、调用点 fallback 和用户可见中文文案约定。 |
| `unicode-user-text` | 1 | 用户可见文本的 Unicode 字符数和截断护栏。 |
| `nuxt-auto-import` | 2 | Nuxt 组件和 Vue API 自动导入约定。 |
| `enum-public-api` | 2 | 公开字符串调用面里的 enum 使用边界。 |
| `nuxt-ssr-state` | 1 | Nuxt 模块级 SSR 不安全状态边界。 |
| `composable-boundary` | 5 | Composable 公开面、私有模块和 UI 层依赖边界。 |
| `component-resource-style` | 3 | 组件 DOM owner、静态样式和静态资源 import 的项目约定。 |
| `vue-reactivity` | 2 | Vue watch、props 读取形态这类响应式代码约定。 |
| `type-readability` | 5 | TypeScript 运行时值、映射表和轻量 computed 的可读性约定。 |
| `load-more-trigger` | 1 | 无限滚动触底触发器复用约定。 |

`project-style` 和 `nuxt-client-only-source` 仍保留为兼容别名。新项目优先使用上表里的细分 config：不涉及 i18n 的项目可以不接 `i18n`，只想检查资源路径的项目也可以单独接 `component-resource-style`。

## 覆盖级别

项目可以先使用内置 config，再覆盖单条规则级别：

```js
import sheng from '@sheng/eslint-plugin'

export default [
  sheng.configs.i18n,
  sheng.configs['component-resource-style'],
  {
    rules: {
      '@sheng/no-dynamic-i18n-t-key': 'error',
      '@sheng/no-i18n-t-fallback': 'error',
    },
  },
]
```

细分 config 里的规则默认也是 `warn`。其中一部分更像迁移和观察工具，例如 `@sheng/no-chinese-user-text-literal`；另一部分能稳定定位运行时风险，例如 `@sheng/no-missing-static-asset-import` 和 `@sheng/no-type-import-used-as-value`。业务项目确认误报范围后，可以把这些确定性更高的规则改成 `error`。
