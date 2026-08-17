# enum 公开 API

这组规则适合 Vue / TypeScript 项目里那些“对外想保留字符串写法、内部又需要命名锚点”的 API。它关注公开调用面的自然程度，不是要求所有状态都改成 enum。

## 适用场景

公开组件 prop 常常希望调用方继续写 `mode="prompt"` 这种字符串 attribute。内部代码又希望有 `DialogMode.Prompt` 这类命名锚点。`const enum` 加字符串值类型可以同时保留这两边语义。

这组规则只抓边界：公开字符串 API 不直接暴露指定 enum 类型；模板里能直接用 enum member 时，不再声明一比一中转常量。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-enum-prop-type`](../no-enum-prop-type.md) | 提醒需要 string-compatible 调用面的 Vue prop 不要直接暴露指定 enum 类型。 |
| [`@sheng/no-template-enum-member-alias`](../no-template-enum-member-alias.md) | 提示 Vue template 可以直接使用 `<script setup>` 里的 enum member，不需要额外声明一比一中转常量。 |

## 相关阅读

- [用 const enum 和字符串值类型保留公开 API 的自然写法](https://shengsheng.fun/2026/07/14/const-enum-string-value-type/) 解释了为什么公开 API 保留字符串写法更自然，以及 Lint 规则为什么只守边界、不把 enum 当成全仓口味。
