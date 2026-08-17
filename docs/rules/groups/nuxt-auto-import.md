# Nuxt 自动导入

这组规则适合启用了 Nuxt 自动导入组件和 Vue API 的项目。它不追求“所有 import 都少写”，只守住项目已经交给 Nuxt 自动生成的那部分公开面。

## 适用场景

Nuxt 会自动导入 `app/components` 下的组件，也会自动导入常见 Vue 运行时 API。继续手写这些 import 会带来两类成本：组件名容易和 Nuxt 真实推导结果不一致，Vue API 的 value import 会让同类代码风格分裂。

如果项目没有启用 Nuxt 自动导入，或者某些目录暂时不归当前 owner 维护，可以通过规则 options 放行对应路径。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-explicit-vue-api-import`](../no-explicit-vue-api-import.md) | 提示 Nuxt 已自动导入的 Vue 运行时 API 不需要再从 `vue` value import。 |
| [`@sheng/no-explicit-vue-component-import`](../no-explicit-vue-component-import.md) | 提示组件和页面优先使用 Nuxt 自动导入组件名，不要显式 import `app/components` 下的 `.vue` 文件。 |

## 相关阅读

- [Nuxt 自动导入不该靠自觉：一次组件和 Vue API import 的 ESLint 护栏](https://shengsheng.fun/2026/07/09/nuxt-auto-import-eslint-guardrail/) 解释了组件 import 的目录边界、Nuxt 组件名推导，以及 Vue API 规则为什么只拦 value import。
