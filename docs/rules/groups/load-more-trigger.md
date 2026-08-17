# 触底加载

这组规则适合已经沉淀了 `useLoadMoreTrigger` 或同类无限滚动触发器的项目。它不禁止普通 `IntersectionObserver`，只提示疑似又手写了一套 load-more 触发逻辑的代码。

## 适用场景

无限滚动不只是观察底部 sentinel。虚拟列表、短列表首屏、数据回来后的高度变化、滚动容器兜底和补偿重检，都可能让单次 `IntersectionObserver` 判断不够稳定。统一触发器应该只负责“当前时机是否应该调用 `loadMore()`”，分页 cursor、失败重试和 tab 切换仍由列表 owner 决定。

这组规则建议用 `warn`。普通曝光、懒加载、动画触发等 observer 场景应该继续保留；迁移中的旧目录可以用 `ignoredPathPatterns` 放行。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/prefer-load-more-trigger`](../prefer-load-more-trigger.md) | 提示疑似无限滚动场景不要手写 `IntersectionObserver`，优先使用 `useLoadMoreTrigger`。 |

## 相关阅读

- [把无限滚动触底触发器抽成 composable：虚拟列表、哨兵和滚动兜底](https://shengsheng.fun/2026/07/24/load-more-trigger-composable-virtual-scroll/) 解释了为什么只观察 sentinel 不够，以及规则为什么同时要求出现 sentinel 命名和 load-more 信号才提示。
