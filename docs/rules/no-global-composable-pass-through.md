---
ruleId: "@sheng/no-global-composable-pass-through"
ruleName: "no-global-composable-pass-through"
config: "composable-boundary"
---

# @sheng/no-global-composable-pass-through

提醒不要把全局 composable 返回值原样透传给组件或页面私有 composable。

## 所属 config

- `composable-boundary`：Composable 公开面、私有模块和 UI 层依赖边界。

## 为什么需要

父组件先调用全局 composable，再把返回值原样转手传给局部 composable，看起来像显式传参，实际会把依赖 owner 放错位置。局部 composable 依赖哪些全局能力，应该由它自己读取；父组件只传真实业务输入。

## 会提示

```ts
import { useCardGridVirtualRows } from './composables'

const { isPad, isPC } = useBreakpoints()

useCardGridVirtualRows({
  isPad,
  isPC,
})
```

## 推荐写法

局部 composable 自己读取断点能力，父层只传业务 source：

```ts
import { useCardGridVirtualRows } from './composables'

const { items } = toRefs(props)

useCardGridVirtualRows({ items })
```

```ts
// ./composables/useCardGridVirtualRows.ts
export function useCardGridVirtualRows(options: { items: Ref<Item[]> }) {
  const { isPad, isPC } = useBreakpoints()

  return computed(() => buildRows(options.items.value, { isPad: isPad.value, isPC: isPC.value }))
}
```

## 适用边界

优先在已经采用 `composable-boundary` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

## 相关阅读

这条规则对应中文文章 [Composable 的公开面别靠默契：用 ESLint 守住私有模块边界](https://shengsheng.fun/2026/07/24/composable-module-boundary-eslint-guardrails/)。文章里的核心判断是：局部 composable 自己读取全局上下文能力，父组件只传业务输入；这样依赖关系和测试 mock 边界都更清楚。

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
      '@sheng/no-global-composable-pass-through': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-global-composable-pass-through/index.mjs`
- 规则短说明：`src/rules/no-global-composable-pass-through/README.md`
- 测试用例：`tests/unit/architecture/`
