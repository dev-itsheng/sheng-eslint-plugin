# 使用指南

`@sheng/eslint-plugin` 提供 shengsheng.fun 前端工程复盘里沉淀的 ESLint 规则。规则默认偏项目约定和架构边界，接入时建议先用 `warn` 观察，再按团队约定提高到 `error`。

## 为什么需要这组规则

Skill 和 `AGENTS.md` 适合描述项目约定，例如目录怎么分、组件怎么拆、哪些写法要避开。它们能提醒开发者和 Agent，但不能阻止下一次改代码时继续写偏。

ESLint 适合承接那些已经比较稳定、能靠 AST 或文件系统判断的约定。编辑器能直接打波浪线，`pnpm lint` 或 CI 也能把问题暴露出来，review 不需要反复解释同一句口径。

这类规则主要挡三类问题：

- 会破坏工具链的写法，例如动态 i18n key 让扫描、补全和缺失检查都失效。
- 会绕过构建前反馈的写法，例如静态资源路径写错，但 TypeScript 因为 `*.svg` 模块声明继续放行。
- 会增加维护成本的写法，例如把固定尺寸藏进 JS style object，或者把一次性映射表命名成看似共享的常量。

项目约定型规则默认以 `warn` 接入更稳。先让危险结构变得可见，等误报和历史例外梳理清楚后，再把确定会导致运行时问题的规则单独升成 `error`。

> 方法论背景可以看这篇中文博客文章：[Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。官网规则页只承接具体规则内容，博客继续保留“为什么要把约定做成护栏”的整理。

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
  sheng.configs.i18n,
  sheng.configs['component-resource-style'],
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
