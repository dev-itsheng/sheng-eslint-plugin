# Vue 响应式写法

这组规则适合已经形成 Vue 响应式代码约定的项目。它不改变 Vue 运行时语义，只提醒那些会让代码意图变模糊的写法。

## 适用场景

`watch(source, (next, previous) => {})` 默认已经在 source 变化后触发，重复比较 `next === previous` 通常会把真实业务条件往后挤。组件脚本里混用 `props.xxx`、`toRef(props, key)` 和 `toRefs(props)`，也会让数据来源和 Ref 形态来回切换。

这组规则适合在组件和页面代码里先用 `warn`。命中后不一定需要机械改动，应该结合当前代码的响应式边界判断。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-redundant-watch-source-compare`](../no-redundant-watch-source-compare.md) | 禁止在单 source watch 回调中冗余比较 next value 和 previous value。 |
| [`@sheng/prefer-to-refs-props`](../prefer-to-refs-props.md) | 提醒组件脚本里统一先 `toRefs(props)`，避免混用多种 props 读取形态。 |

## 相关阅读

- [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/) 说明了为什么要把反复出现的项目约定沉淀成 ESLint 护栏；本组具体规则内容以当前文档站为准。
