---
ruleId: "@sheng/no-extra-composable-exports"
ruleName: "no-extra-composable-exports"
config: "composable-boundary"
---

# @sheng/no-extra-composable-exports

use*.ts composable 文件只允许默认导出主 composable。

## 所属 config

- `composable-boundary`：Composable 公开面、私有模块和 UI 层依赖边界。

## 为什么需要

`use*.ts` 文件应该只表达一个主入口：默认导出的 composable。类型、枚举、常量和辅助函数如果也从这个文件导出，调用方很容易开始 deep import，把一个私有实现文件当成目录公开面使用。

需要公开多种对象时，优先让目录 barrel 或旁边的 `types.ts`、`constants.ts` 承担这个角色。这样读者看到 `useFeatureState.ts` 时，就知道它只负责主 composable。

## 会提示

```ts
export type FeatureContext = {
  id: string
}

export const FeatureMode = {
  Compact: 'compact',
}

export default function useFeatureState() {
  return {}
}
```

## 推荐写法

```ts
export default function useFeatureState() {
  return {}
}
```

```ts
// types.ts
export type FeatureContext = {
  id: string
}
```

```ts
// constants.ts
export const FeatureMode = {
  Compact: 'compact',
}
```

## 适用边界

优先在已经采用 `composable-boundary` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

## 相关阅读

这条规则对应中文文章 [Composable 的公开面别靠默契：用 ESLint 守住私有模块边界](https://shengsheng.fun/2026/07/24/composable-module-boundary-eslint-guardrails/)。文章里的核心口径是：`use*.ts` 文件只暴露主入口，类型、枚举和常量移到同目录的专用文件；这样可以阻止实现细节在 deep import 里变成事实公开 API。

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
      '@sheng/no-extra-composable-exports': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-extra-composable-exports/index.mjs`
- 规则短说明：`src/rules/no-extra-composable-exports/README.md`
- 测试用例：`tests/unit/architecture/`
