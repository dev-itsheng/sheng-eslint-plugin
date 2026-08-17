# 组件与资源约定

这组规则适合 Vue 组件里已经有稳定 DOM owner、样式层和静态资源组织约定的项目。它关注的是“代码写法会不会绕开项目结构”，不是普通格式化。

## 适用场景

组件内部直接查 DOM、把固定尺寸藏进 JS style object、或者 import 一个不存在的静态资源，都会让问题晚于 review 暴露。更稳的做法是把 DOM 所有权留在模板结构里，把固定视觉约束放回样式层，把资源路径检查提前到 lint。

这组规则里，`@sheng/no-missing-static-asset-import` 命中后通常是确定会坏的问题，确认 alias 配置正确后可以升成 `error`。DOM query 和固定 px 内联样式更像结构约定，建议先保留 `warn`。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-dom-query-in-component`](../no-dom-query-in-component.md) | 提示组件和页面不要用 DOM 查找 API，优先使用 template ref 或 function ref。 |
| [`@sheng/no-missing-static-asset-import`](../no-missing-static-asset-import.md) | 检查静态资源 import 的目标文件是否真实存在。 |
| [`@sheng/no-static-px-inline-style`](../no-static-px-inline-style.md) | 提示 Vue 组件不要把固定 px 样式写成 `:style` 绑定对象。 |

## 相关阅读

- [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/) 里讨论了这组规则的共同点：它们不是统一审美，而是把 DOM owner、静态样式和资源路径这类容易晚暴露的问题提前到 lint 阶段。
