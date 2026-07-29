# 使用指南

`@sheng/eslint-plugin` 提供 shengsheng.fun 前端工程复盘里沉淀的 ESLint 规则。规则默认偏项目约定和架构边界，接入时建议先用 `warn` 观察，再按团队约定提高到 `error`。

## 安装

```bash
pnpm add -D @sheng/eslint-plugin eslint
```

Vue / Nuxt 项目通常还需要安装 parser：

```bash
pnpm add -D vue-eslint-parser @typescript-eslint/parser
```

## Flat config

```js
import sheng from '@sheng/eslint-plugin'

export default [
  sheng.configs['vue-script-setup'],
  sheng.configs['project-style'],
]
```

需要单独开启规则时，先注册插件：

```js
import sheng from '@sheng/eslint-plugin'

export default [
  {
    plugins: {
      '@sheng': sheng,
    },
    rules: {
      '@sheng/no-dynamic-i18n-t-key': 'warn',
    },
  },
]
```

## Vue SFC parser

本包不会替项目接管 parser。Vue SFC 项目需要在自己的 ESLint 配置里把 `.vue` 文件交给 `vue-eslint-parser`，并把 TypeScript 解析交给 `@typescript-eslint/parser`。

```js
import tsParser from '@typescript-eslint/parser'
import sheng from '@sheng/eslint-plugin'
import vueParser from 'vue-eslint-parser'

export default [
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },
  sheng.configs['vue-script-setup'],
]
```

## 复制源码

不想引入 npm 包时，可以按 `FILES.json` 复制 `src/index.js`、`src/configs.js`、`src/rules/index.js` 和需要的规则目录。`AGENT_PROMPT.md` 提供给 Coding Agent 的迁移 prompt。
