---
ruleId: "@sheng/no-missing-static-asset-import"
ruleName: "no-missing-static-asset-import"
config: "project-style"
---

# @sheng/no-missing-static-asset-import

检查静态资源 import 的目标文件是否真实存在，避免 dev/build 阶段才暴露缺文件。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

## 背景

前端项目通常会给 `*.png`、`*.svg`、`*.webp` 这类静态资源补 TypeScript module declaration。这样写组件时可以正常 `import icon from './icon.svg'`，但类型兜底只能说明“这种后缀可以被 import”，不能证明路径上的文件真实存在。

路径写错后，TypeScript 可能仍然安静，真正报错会拖到 Vite dev、Nuxt build 或线上资源加载阶段。这条规则把检查提前到 ESLint：只要 import source 是静态资源后缀，就按当前文件路径或配置的 alias target 去检查文件是否存在。

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
