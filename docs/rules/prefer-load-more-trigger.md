---
ruleId: "@sheng/prefer-load-more-trigger"
ruleName: "prefer-load-more-trigger"
config: "load-more-trigger"
---

# @sheng/prefer-load-more-trigger

提示疑似无限滚动场景不要手写 IntersectionObserver，优先使用 useLoadMoreTrigger。

## 所属 config

- `load-more-trigger`：无限滚动触底触发器复用约定。

## 为什么需要

无限滚动不只是观察底部 sentinel。虚拟列表会改写内容高度和 DOM 节点，短列表首屏也可能在数据回来后仍然需要补偿重检。只手写 `useIntersectionObserver`，很容易漏掉 scroll fallback、数据变化后的 recheck 和 loading / hasMore 的时序。

## 会提示

```vue
<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

const loadMoreSentinelElement = shallowRef<HTMLElement | null>(null)
const hasMore = computed(() => nextIndex.value > 0)

function loadMoreActiveTab() {}

useIntersectionObserver(loadMoreSentinelElement, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value) loadMoreActiveTab()
})
</script>
```

## 推荐写法

```ts
useLoadMoreTrigger({
  canLoadMore: computed(() => hasMore.value && !loading.value),
  loadMore: loadMoreActiveTab,
  scrollElement,
  sentinelElement: loadMoreSentinelElement,
  recheckSources: [items, activeTab],
})
```

## 适用边界

优先在已经采用 `load-more-trigger` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

规则判断比较保守：源码里同时出现 sentinel 命名，以及 `loadMore`、`hasMore`、`nextIndex` 这类加载更多信号时，才会提示 `@vueuse/core` 里的 `useIntersectionObserver`。普通曝光、懒加载和动画触发场景不会因为用了 observer 就被拦。

## 相关阅读

这条规则对应中文文章 [把无限滚动触底触发器抽成 composable：虚拟列表、哨兵和滚动兜底](https://shengsheng.fun/2026/07/24/load-more-trigger-composable-virtual-scroll/)。文章里的核心结论是：`useLoadMoreTrigger` 只负责触发时机，分页请求、cursor、错误态和 tab 切换仍归列表 owner；Lint 只提醒疑似新手写的 load-more observer。

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
      '@sheng/prefer-load-more-trigger': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/prefer-load-more-trigger/index.mjs`
- 规则短说明：`src/rules/prefer-load-more-trigger/README.md`
- 测试用例：`tests/unit/architecture/`
