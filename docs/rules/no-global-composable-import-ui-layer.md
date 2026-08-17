---
ruleId: "@sheng/no-global-composable-import-ui-layer"
ruleName: "no-global-composable-import-ui-layer"
config: "composable-boundary"
---

# @sheng/no-global-composable-import-ui-layer

禁止全局 composable 反向 import UI 层。

## 所属 config

- `composable-boundary`：Composable 公开面、私有模块和 UI 层依赖边界。

## 为什么需要

`app/composables` 里的全局 composable 通常承担 source、action、缓存刷新、跨入口同步这类稳定业务能力。它可以被页面和组件使用，但不应该反向 import `app/components` 或 `app/pages` 里的 UI 层实现。

全局层反向依赖 UI 层后，组件私有 helper 会被误认为公共 API；后续重构组件时，也会拖到基础状态和业务 action。

## 会提示

```ts
// app/composables/useAuthActions.ts
import { clearFeedCache } from '~/components/feed/FeedSection/composables/useFeedCache'

export function useAuthActions() {
  return {
    logout() {
      clearFeedCache()
    },
  }
}
```

## 推荐写法

共享逻辑应该上移到全局 composable、utils、shared 或稳定 types 层：

```ts
// app/composables/useAuthActions.ts
import { clearFeedCache } from '~/composables/useFeedCache'

export function useAuthActions() {
  return {
    logout() {
      clearFeedCache()
    },
  }
}
```

## 适用边界

优先在已经采用 `composable-boundary` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

## 相关阅读

这条规则对应中文文章 [Composable 的公开面别靠默契：用 ESLint 守住私有模块边界](https://shengsheng.fun/2026/07/24/composable-module-boundary-eslint-guardrails/)。文章里的核心口径是：全局 composable 是更稳定的 source/action 层；如果逻辑只服务某个组件，就留在组件就近目录，如果要共享，就上移到真正稳定的公共层。

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
      '@sheng/no-global-composable-import-ui-layer': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-global-composable-import-ui-layer/index.mjs`
- 规则短说明：`src/rules/no-global-composable-import-ui-layer/README.md`
- 测试用例：`tests/unit/architecture/`
