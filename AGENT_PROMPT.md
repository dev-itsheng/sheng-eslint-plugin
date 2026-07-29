# Agent 接入 Prompt

你要把 `@sheng/eslint-plugin` 里的 ESLint 护栏接入当前前端项目。

1. 优先选择安装包：在目标项目安装 `@sheng/eslint-plugin`，并在 `eslint.config.js` 注册 `plugins: { '@sheng': sheng }` 或直接使用需要的 `sheng.configs[...]`。
2. 如果项目不愿引入包，再读取 `FILES.json`，只复制需要的 `src/rules/<rule-name>/` 和 `src/rules/utils/` 到项目本地 ESLint 规则目录。
3. Vue / Nuxt 项目要确认 `.vue` 文件仍由 `vue-eslint-parser` 解析，TypeScript 解析器继续放在 `parserOptions.parser` 或 flat config 的 `languageOptions.parser`。
4. 首次接入默认使用 `warn`，按项目目录、i18n 函数、静态资源 alias、历史例外路径调整 rule options。
5. 迁移后运行对应 RuleTester、项目 ESLint 命令和一次真实 lint，确认没有把历史债务直接升级成阻塞。
