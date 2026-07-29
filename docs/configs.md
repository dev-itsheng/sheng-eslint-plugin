# Configs

内置 config 都是 ESLint flat config 片段，只注册 `@sheng` 插件并以 `warn` 开启对应规则。它们不设置 parser、globals、ignores 或 formatter。

| Config | 规则数 | 说明 |
| --- | ---: | --- |
| `all` | 27 | 当前全部 ESLint rule，适合本地试跑或 CI 观察期。 |
| `vue-script-setup` | 2 | Vue `<script setup>` 宏和组件命名边界。 |
| `unicode-user-text` | 1 | 用户可见文本的 Unicode 字符数和截断护栏。 |
| `nuxt-auto-import` | 2 | Nuxt 组件和 Vue API 自动导入约定。 |
| `enum-public-api` | 2 | 公开字符串调用面里的 enum 使用边界。 |
| `nuxt-client-only-source` | 1 | Nuxt 模块级 SSR 不安全状态边界。 |
| `composable-boundary` | 5 | Composable 公开面、私有模块和 UI 层依赖边界。 |
| `project-style` | 13 | 项目风格、i18n、静态资源和类型可读性约定。 |
| `load-more-trigger` | 1 | 无限滚动触底触发器复用约定。 |

## 覆盖级别

项目可以先使用内置 config，再覆盖单条规则级别：

```js
import sheng from '@sheng/eslint-plugin'

export default [
  sheng.configs['project-style'],
  {
    rules: {
      '@sheng/no-dynamic-i18n-t-key': 'error',
      '@sheng/no-i18n-t-fallback': 'error',
    },
  },
]
```
