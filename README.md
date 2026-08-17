# @sheng/eslint-plugin

`@sheng/eslint-plugin` 收纳了 shengsheng.fun 多篇前端工程复盘里沉淀下来的 ESLint 护栏。它关注的是日常 review 很难稳定守住的项目约定：Vue `<script setup>` 编译边界、Nuxt 自动导入习惯、composable 公开面、用户可见文本的 Unicode 处理、i18n key、静态资源 import、局部映射表写法，以及一些长期靠口头约定维护的风格细节。

这些规则来自真实项目里的问题复盘，默认偏“项目约定”和“架构边界”，不按通用 `recommended` 预设来设计。接入时建议先用 `warn` 观察一段时间，再把适合当前项目的规则逐条提高到 `error`。

## 背景

这些规则最早散落在博客文章的源码包里。那种组织方式适合读文章和复制示例：每篇文章只带自己讨论的规则、测试和接入 prompt，读者可以就近看到问题、修复方式和可复制源码。

真正复用时会遇到几个维护成本：

- 同一类 helper 会在多个文章源码包里重复出现，后续修 bug 容易漏同步。
- 规则测试、示例配置和 README 分散在不同文章目录里，无法形成一个稳定的发版入口。
- 文章里的旧 namespace 跟未来 npm 包不一致，读者复制到项目后还要自己决定 ruleId。
- Code Lab 需要浏览器可运行的快照，npm 包又需要 Node / ESLint 环境，两边约束不同。
- 用户如果只想安装规则，不应该先理解整套博客资源目录。

这个包把 ESLint rule 本身变成主来源。完整规则文档放在 `docs/rules/`，并通过 VitePress 发布到 GitHub Pages；博客源码包继续保留，但它们变成从本包同步出去的文章快照。读者可以安装 npm 包，也可以继续按 `FILES.json` 复制源码。

## 方案

本包采用 ESLint flat config 形态，只公开根入口：

```js
import sheng, { configs, rules } from '@sheng/eslint-plugin'
```

默认导出是标准 ESLint plugin 对象：

```js
{
  meta: {
    name: '@sheng/eslint-plugin',
    version: '0.1.0',
    namespace: '@sheng',
  },
  rules,
  configs,
  processors: {},
}
```

公开 ruleId 统一使用 `@sheng/<rule-name>`。旧文章里的 `project-style/*`、`nuxt-auto-import/*` 这类 namespace 只保留在历史语境里，新接入时不要继续使用。

包内暂不承诺 deep import。`src/rules/` 的文件可以作为“复制源码”路径使用，`docs/rules/` 是完整规则说明来源；npm API 只承诺 `@sheng/eslint-plugin` 根入口。

## 安装

发布到 npm 后，可以直接安装：

```bash
pnpm add -D @sheng/eslint-plugin eslint
```

Vue / Nuxt 项目通常还需要在自己的 ESLint 配置里配置 parser：

```bash
pnpm add -D vue-eslint-parser @typescript-eslint/parser
```

`eslint` 是 peer dependency。`vue-eslint-parser` 和 `@typescript-eslint/parser` 是可选 peer dependency，本包的 configs 不会替项目接管 parser。

当前开发和测试环境使用 ESLint 10。`peerDependencies` 允许 `^8.57.0 || ^9.0.0 || ^10.0.0`，但配置示例都按 flat config 写；还在使用 `.eslintrc` 的项目需要自己按旧格式注册插件和规则。

Node 版本要求跟随当前 ESLint 10 生态：

```json
{
  "node": "^20.19.0 || ^22.13.0 || >=24"
}
```

## 快速接入

最省事的方式是直接使用某个分组 config。所有内置 config 都以 `warn` 开启规则：

```js
// eslint.config.js
import sheng from '@sheng/eslint-plugin'

export default [
  sheng.configs.i18n,
  sheng.configs['component-resource-style'],
  sheng.configs['composable-boundary'],
  {
    rules: {
      '@sheng/no-dynamic-i18n-t-key': 'error',
    },
  },
]
```

也可以只注册插件，然后手动开启单条规则：

```js
import sheng from '@sheng/eslint-plugin'

export default [
  {
    plugins: {
      '@sheng': sheng,
    },
    rules: {
      '@sheng/no-native-string-user-text-ops': 'warn',
    },
  },
]
```

Vue SFC 项目需要先把 `.vue` 文件交给 `vue-eslint-parser`。本包不会替你设置这部分，因为每个项目的 parser、parserOptions、tsconfig 和文件范围都可能不同：

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

## 配置

| 配置 | 规则数 | 适合先接入的项目 |
| --- | ---: | --- |
| `all` | 27 | 想完整试跑所有规则的项目。建议只用于本地试验或 CI 观察期。 |
| `vue-script-setup` | 2 | 使用 Vue `<script setup>`，并且遇到过宏调用位置、模板名称解析冲突的项目。 |
| `i18n` | 3 | 使用翻译 key、语言包和用户可见文案清单的国际化项目。 |
| `unicode-user-text` | 1 | 需要正确统计或截断用户可见文本的产品。 |
| `nuxt-auto-import` | 2 | 使用 Nuxt 自动导入组件和 Vue API 的项目。 |
| `enum-public-api` | 2 | 需要保留字符串兼容公开 API，同时内部希望使用 enum 的 Vue / TypeScript 项目。 |
| `nuxt-ssr-state` | 1 | Nuxt 项目里有 `use*` composable，并且需要明确 SSR 下模块级状态边界。 |
| `composable-boundary` | 5 | 已经形成 composable 分层，想守住公开面、私有模块和 UI 层依赖方向的项目。 |
| `component-resource-style` | 3 | 想把组件 DOM owner、静态样式和静态资源 import 约定写进 ESLint 的项目。 |
| `vue-reactivity` | 2 | 想统一 Vue watch 和 props 读取形态的项目。 |
| `type-readability` | 5 | 想减少 TypeScript 映射表、type import 和轻量 computed 噪音的项目。 |
| `load-more-trigger` | 1 | 有统一 `useLoadMoreTrigger` 或类似无限滚动触底触发器的项目。 |

这些 config 都是普通 flat config 片段，可以和项目已有配置自由组合。它们只注册 `@sheng` 插件并打开规则，不设置 parser、globals、ignores 或 formatter。

`project-style` 和 `nuxt-client-only-source` 仍保留为兼容别名。新项目优先使用细分 config：不涉及 i18n 的项目可以不接 `i18n`，只需要资源路径检查时也可以单独接 `component-resource-style`。

## 文档站部署

文档站用 VitePress 构建，GitHub Pages 地址是 `https://dev-itsheng.github.io/sheng-eslint-plugin/`。当前仓库是普通 project page，所以 `docs/.vitepress/config.ts` 里的 `base` 必须保持为 `/sheng-eslint-plugin/`。

部署由 `.github/workflows/docs.yml` 负责：推送到 `main` 或手动触发 workflow 时，先安装依赖、跑 `docs:check`，再执行 `pnpm run docs:build`，最后把 `docs/.vitepress/dist` 作为 GitHub Pages artifact 发布。

仓库第一次启用 Pages 时，还需要在 GitHub 仓库的 `Settings -> Pages -> Build and deployment -> Source` 里选择 `GitHub Actions`。这个设置不能靠仓库文件自动完成；设置好以后，推送 `main` 等 workflow 完成即可访问文档站。

## 规则

规则按内置 config 分组列出。每条规则的细节、反例、正例和选项以 `docs/rules/<rule-name>.md` 为准；这里先给接入者一个扫读入口，帮助判断哪些规则适合当前项目。

### `vue-script-setup`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-nested-define-props` | 避免把 Vue `<script setup>` 的 `defineProps()` 包进普通运行时表达式，导致编译器宏没有被识别。 |
| `@sheng/no-component-name-conflict` | 避免组件 tag 或自定义指令名和顶层绑定只靠大小写区分，导致模板解析到错误对象。 |

### `i18n`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-dynamic-i18n-t-key` | 要求 i18n 的 `t()` 第一个参数必须是字符串字面量，保证 IDE 插件和静态扫描能识别真实 key。 |
| `@sheng/no-i18n-t-fallback` | 禁止在 i18n 翻译函数调用里传 fallback，避免缺失 key 被调用点静默掩盖。 |
| `@sheng/no-chinese-user-text-literal` | 扫描运行时代码里的中文字面量；用户可见中文应使用已有 i18n key，待补文案进入项目文案清单。 |

### `unicode-user-text`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-native-string-user-text-ops` | 禁止在用户可见文本里直接使用原生字符串长度或截断 API，避免 UTF-16 code unit 计数和切片误伤 emoji、国旗和组合字符。 |

### `nuxt-auto-import`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-explicit-vue-api-import` | 提示 Vue 运行时 API 在 Nuxt SFC / app 代码里应使用自动导入，类型 import 仍允许显式保留。 |
| `@sheng/no-explicit-vue-component-import` | 提示 Nuxt 组件应使用自动导入名，避免在组件和页面里显式 import `.vue` 组件。 |

### `enum-public-api`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-enum-prop-type` | 提醒少数需要 string-compatible 调用面的 Vue props 不要直接暴露指定 enum 类型。 |
| `@sheng/no-template-enum-member-alias` | 提示 Vue template 可以直接使用 `<script setup>` 里的 enum member，不需要额外声明一比一中转常量。 |

### `nuxt-ssr-state`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-ssr-unsafe-module-state` | 提醒 Nuxt `use*` composable 里的模块级可变状态必须显式声明 SSR 策略。 |

### `composable-boundary`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-extra-composable-exports` | `use*.ts` composable 文件只允许默认导出主 composable。 |
| `@sheng/no-flat-private-child-module` | 提示只有单一父调用方的私有 composable 或 component 不要和父文件平铺在同一个目录。 |
| `@sheng/no-global-composable-import-ui-layer` | 禁止全局 composable 反向 import UI 层。 |
| `@sheng/no-global-composable-pass-through` | 提醒不要把全局 composable 返回值原样透传给组件或页面私有 composable。 |
| `@sheng/no-nested-vue-context-composable` | 限制依赖当前 Vue / Nuxt 上下文的 API 只能在 setup 或 `use*.ts` composable 主函数顶层同步调用。 |

### `component-resource-style`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-dom-query-in-component` | 提示组件和页面不要用 DOM 查找 API，优先使用 template ref 或 function ref。 |
| `@sheng/no-missing-static-asset-import` | 检查静态资源 import 的目标文件是否真实存在，避免 dev / build 阶段才暴露缺文件。 |
| `@sheng/no-static-px-inline-style` | 提示 Vue 组件不要把固定 px 样式写成 `:style` 绑定对象。 |

### `vue-reactivity`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-redundant-watch-source-compare` | 禁止在单 source watch 回调中冗余比较 next value 和 previous value。 |
| `@sheng/prefer-to-refs-props` | 提醒组件脚本里不要直接读取 `props.xxx` 或 `toRef(props, key)`，统一先 `toRefs(props)`。 |

### `type-readability`

| 规则 | 作用 |
| --- | --- |
| `@sheng/no-type-import-used-as-value` | 提示 type-only import 不能在运行时表达式里当值使用。 |
| `@sheng/no-redundant-indexed-record-satisfies` | 提示完整 `Record` 映射表被立即索引时去掉冗余 `satisfies`。 |
| `@sheng/prefer-keyed-object-map` | 提醒同一个离散 key 的分支优先改成对象字面量加 key 映射。 |
| `@sheng/prefer-inline-single-use-map` | 提示只被索引读取一次的对象 / 数组映射表直接内联到使用处。 |
| `@sheng/prefer-inline-trivial-computed` | 提示不要用 `computed` 只包一层静态 i18n 调用或简单模板 class map。 |

### `load-more-trigger`

| 规则 | 作用 |
| --- | --- |
| `@sheng/prefer-load-more-trigger` | 提示疑似无限滚动场景不要手写 `IntersectionObserver`，优先使用 `useLoadMoreTrigger`。 |

## 适合怎样接入

这套规则不要求一次全部打开。更稳的做法是按问题域接入：

1. Vue / Nuxt 项目先接 `vue-script-setup` 和 `nuxt-auto-import`，它们通常能比较快暴露真实问题。
2. 有国际化的项目接 `i18n`；只处理单语言产品时可以先跳过这一组。
3. 有用户输入展示和截断需求的项目接 `unicode-user-text`。
4. composable 已经成为项目结构约定后，再接 `composable-boundary`，避免规则先于目录边界落地。
5. 对历史代码量比较大的项目，先保持 `warn`，用 CI artifact 或本地 lint 输出观察命中情况。
6. 每条规则确认适合当前团队后，再在项目配置里覆盖成 `error`。

示例：

```js
import sheng from '@sheng/eslint-plugin'

export default [
  sheng.configs.i18n,
  sheng.configs['component-resource-style'],
  {
    rules: {
      '@sheng/no-dynamic-i18n-t-key': 'error',
      '@sheng/no-i18n-t-fallback': 'error',
      '@sheng/no-dom-query-in-component': 'warn',
    },
  },
]
```

## 复制源码

如果暂时不想直接安装 npm 包，可以把本仓库当成源码工具包使用：

1. 读取 `FILES.json`，确认需要复制的入口和规则文件。
2. 复制 `src/index.js`、`src/configs.js`、`src/rules/index.js`。
3. 复制需要的 `src/rules/<rule-name>/` 目录。
4. 按 import 关系复制 `src/rules/utils/` 下被规则用到的 helper。
5. 在目标项目里注册本地 plugin，并把 ruleId 保持为 `@sheng/<rule-name>` 或改成团队自己的 namespace。

`AGENT_PROMPT.md` 提供了给 Coding Agent 的迁移 prompt。读者可以把它连同 `FILES.json` 一起交给 Agent，让 Agent 按目标项目的 ESLint 结构完成复制、改 import、补测试和接入配置。

博客文章里的 kit 也会继续保留源码快照。Code Lab 仍使用文章快照或专用浏览器 runner，不直接 import npm 包入口。

## 目录结构

```text
src/
  index.js              # plugin 入口，导出 meta / rules / configs / processors
  configs.js            # 生成 warn 级别 flat config
  rules/
    index.js            # rule 注册表
    groups.js           # config 分组和文档侧分组展示信息
    <rule-name>/        # 单条 rule 实现和源码旁短 README
    utils/              # 多条 rule 共享的 helper
docs/
  index.md              # 文档站首页
  guide.md              # 安装、配置和复制源码说明
  configs.md            # config 分组说明
  rules/
    index.md            # 规则列表
    groups/             # 分组说明页，侧边栏一级分组会链接到这里
    <rule-name>.md      # 单条 rule 完整文档
tests/
  unit/architecture/    # 从文章源码包迁移过来的 RuleTester 用例
scripts/
  generate-files-index.ts
  check-docs.ts
  sync-blog-kits.ts
```

`scripts/sync-blog-kits.ts` 维护本包到 sheng-blog 文章 kit 的固定映射。同步时会复制 `src/rules/` 的源码，并把 `docs/rules/<rule-name>.md` 写回博客快照里的规则 README。它只同步已登记的 ESLint kit，不处理 Stylelint、UnoCSS、Nitro、SVG 检查脚本等非 ESLint 工具。

## 维护流程

修改或新增规则时，先把本包当成主来源处理：

1. 在 `src/rules/<rule-name>/` 修改规则实现；源码旁 README 只保留短入口。
2. 在 `tests/unit/architecture/` 增加或调整 RuleTester 用例。
3. 在 `docs/rules/<rule-name>.md` 修改完整规则文档。
4. 必要时更新 `src/rules/index.js` 里的 `rules` 和 `src/rules/groups.js` 里的 `ruleGroups`。
5. 运行 `pnpm test`，其中会同时跑 RuleTester 和 `docs:check`。
6. 运行 `pnpm run files:index` 更新 `FILES.json`。
7. 运行 `pnpm run sync:blog` 把规则源码、测试、文档和示例同步回博客源码包。
8. 回到 sheng-blog 跑 kit、Code Lab 和 Hexo 生成验证。

博客侧建议验证：

```bash
pnpm run test:kits
pnpm run build:code-lab
pnpm exec tsc -p build-scripts/tsconfig.json
git diff --check
pnpm exec hexo clean
pnpm exec hexo generate
```

## 发包前检查

本包发版前至少跑这些命令：

```bash
pnpm test
node -e "import('./src/index.js').then(({ default: plugin }) => console.log(Object.keys(plugin.rules).length, Object.keys(plugin.configs)))"
npm pack --dry-run
```

真正发布前还要确认 npm 登录态和 scope 权限：

```bash
npm whoami
npm publish --access public
```

当前包名假设 `@sheng` scope 可公开发布。如果 npm 权限检查失败，先停下处理 scope 权限，不要临时改包名绕过。

## 版本和边界

首版只包含 ESLint rules。下面这些工具不放进这个包：

- `check-figma-svg-frame`。
- Stylelint 规则或样式扫描脚本。
- UnoCSS、Nitro、构建发布相关脚本。
- 博客 Code Lab runner。

运行时依赖只保留规则真正 import 的包，例如 `typescript` 和 `scule`。parser、ESLint 本体和 Vue 编译相关依赖放在 peer / dev dependency 里，避免插件安装后替目标项目决定解析策略。

规则行为仍然以“可读、可迁移、能解释给团队”为优先级。命中结果需要结合项目约定判断；这个包提供护栏，不替项目决定所有架构边界。
