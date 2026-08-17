# Vue `<script setup>`

这组规则适合所有使用 Vue `<script setup>` 的项目。它关注编译器宏入口和模板名称解析：代码在 TypeScript 里看起来能写，不代表 Vue 编译器一定能把它识别成预期的宏、组件或指令。

## 适用场景

`<script setup>` 会把顶层绑定暴露给模板，同时也会在编译阶段识别 `defineProps()`、`withDefaults()` 这类宏。宏调用位置不对时，编译产物会残留运行时不存在的宏函数；组件或指令名只靠大小写和普通变量区分时，模板可能解析到错误绑定。

这组规则建议在 Vue SFC 项目里优先开启。它们命中后通常已经存在稳定风险，历史代码确认误报范围后可以按项目情况升成 `error`。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-nested-define-props`](../no-nested-define-props.md) | 避免把 `defineProps()` 包进普通运行时表达式，导致编译器宏没有被识别。 |
| [`@sheng/no-component-name-conflict`](../no-component-name-conflict.md) | 避免组件 tag 或自定义指令名和顶层绑定只靠大小写区分，导致模板解析到错误对象。 |

## 相关阅读

- [Vue script setup 中 defineProps 的编译边界与错误排查](https://shengsheng.fun/2026/05/23/vue-defineprops-macro-wrapper/) 解释了 `defineProps()` 为什么必须处在 Vue 编译器能识别的宏入口上。
- [Vue script setup 中组件静默消失的原因：一次命名冲突排查](https://shengsheng.fun/2026/05/26/vue-script-setup-component-name-conflict/) 解释了模板 tag 和自定义指令如何在 `<script setup>` 顶层绑定里按候选名解析。
