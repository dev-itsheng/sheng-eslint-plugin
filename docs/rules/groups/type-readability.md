# 类型和可读性

这组规则适合 TypeScript 项目里已经有“可读性优先于聪明写法”的约定。它把运行时值、映射表和轻量 computed 的常见偏差变成 lint 提示。

## 适用场景

`import type` 被当成运行时值使用属于明确风险；同一个离散 key 的连续分支适合改成映射表；只被读取一次的映射表和立即索引的 `Record` 标注则容易制造类型噪音。静态 i18n 调用或简单 class map 被包进 `computed()`，也会让读者误以为它有复杂响应式语义。

这组规则多数不适合自动修复。映射表可能有注释、函数副作用、复杂类型或团队刻意保留的命名，Lint 只负责把结构异味标出来。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-type-import-used-as-value`](../no-type-import-used-as-value.md) | 提示 type-only import 不能在运行时表达式里当值使用。 |
| [`@sheng/no-redundant-indexed-record-satisfies`](../no-redundant-indexed-record-satisfies.md) | 提示完整 `Record` 映射表被立即索引时去掉冗余 `satisfies`。 |
| [`@sheng/prefer-keyed-object-map`](../prefer-keyed-object-map.md) | 提醒同一个离散 key 的分支优先改成对象字面量加 key 映射。 |
| [`@sheng/prefer-inline-single-use-map`](../prefer-inline-single-use-map.md) | 提示只被索引读取一次的对象 / 数组映射表直接内联到使用处。 |
| [`@sheng/prefer-inline-trivial-computed`](../prefer-inline-trivial-computed.md) | 提示不要用 `computed()` 只包一层静态 i18n 调用或简单模板 class map。 |

## 相关阅读

- [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/) 里把这组规则定位成“减少维护噪音”：明确运行时错误风险，收敛离散状态映射，去掉没有复用语义的中间命名。
