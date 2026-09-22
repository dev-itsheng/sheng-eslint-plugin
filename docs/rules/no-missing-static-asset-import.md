---
ruleId: "@sheng/no-missing-static-asset-import"
ruleName: "no-missing-static-asset-import"
config: "component-resource-style"
---

# @sheng/no-missing-static-asset-import

检查静态资源 import 的目标文件是否真实存在，避免 dev/build 阶段才暴露缺文件。

## 所属 config

- `component-resource-style`：组件 DOM owner、静态样式和静态资源 import 的项目约定。

## 背景

前端项目通常会给 `*.png`、`*.svg`、`*.webp` 这类静态资源补 TypeScript module declaration。这样写组件时可以正常 `import icon from './icon.svg'`，但类型兜底只能说明“这种后缀可以被 import”，不能证明路径上的文件真实存在。

路径写错后，TypeScript 可能仍然安静，真正报错会拖到 Vite dev、Nuxt build 或线上资源加载阶段。这条规则把检查提前到 ESLint：只要 import source 是静态资源后缀，就按当前文件路径或配置的 alias target 去检查文件是否存在。

这条规则适合在业务项目里升成 `error`。资源文件不存在属于确定会坏的问题，继续用 `warn` 只是在等构建或运行时用更晚、更吵的方式报出来。

## 会提示

如果当前文件旁边没有 `assets/empty.svg`，或者 `@/assets/success.mp3` 对应 alias 目录下没有真实文件，规则会提示：

```ts
import emptyIcon from './assets/empty.svg'
import successAudio from '@/assets/success.mp3'
```

## 推荐处理

把 import 指向真实存在的资源，或者先把缺失资源补进对应目录：

```ts
import emptyIcon from './assets/empty-state.svg'
import successAudio from '@/assets/audio/success.mp3'
```

## 检查范围

默认检查这些后缀：

```text
.avif .gif .jpeg .jpg .json .mp3 .mp4 .ogg .png .svg .wav .webm .webp
```

默认支持 Nuxt 常见 alias：

- `~/`、`@/` 指向 `app/`
- `~~/`、`@@/` 指向项目根目录
- `#shared/` 指向 `shared/`
- `#server/` 指向 `server/`

如果项目目录结构不同，用 `aliases` 覆盖默认值：

```js
'@sheng/no-missing-static-asset-import': [
  'warn',
  {
    aliases: [
      { prefix: '@/', target: 'src/' },
      { prefix: '#shared/', target: 'shared/' },
    ],
  },
]
```

`target` 可以是相对项目根目录的路径，也可以是绝对路径。相对路径会按 ESLint 当前工作目录解析。

## 边界

这条规则只检查静态字符串 import，不检查下面这些场景：

- `new URL(dynamicName, import.meta.url)`
- 远程 URL
- public 目录里的运行时拼接路径
- 需要 loader / query 额外生成的虚拟资源

这些场景要靠构建、运行时测试或更贴近项目的专项脚本验证。

## 和 TypeScript module declaration 的关系

`declare module '*.svg'` 只能让 TypeScript 接受这种 import 形态，它不会去磁盘上确认 `./assets/empty.svg` 是否真实存在。这条规则补的是“路径存在性”检查，不替代资源 loader、图片优化、public 路径约定或运行时 CDN 校验。

## 相关阅读

这条规则的方法论背景见中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。具体触发条件、示例、配置和维护入口以本页为准。

## 在线试一下

<RuleDemo rule="no-missing-static-asset-import" />

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
      '@sheng/no-missing-static-asset-import': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-missing-static-asset-import/index.mjs`
- 规则短说明：`src/rules/no-missing-static-asset-import/README.md`
- 测试用例：`tests/unit/architecture/`
