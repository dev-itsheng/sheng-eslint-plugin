# Nuxt SSR 状态

这组规则适合 Nuxt 项目里有 `use*` composable，并且需要明确模块级状态 SSR 边界的场景。它不是“禁止所有模块级变量”，而是要求可变状态写清楚 owner 和 SSR 策略。

## 适用场景

Nuxt 服务端渲染下，模块级变量可能在请求之间共享。可序列化业务数据通常更适合 Pinia、`useState` 或请求缓存；页面局部状态应该在组件 setup 内创建；跨组件 DOM 桥接可以用显式 client-only source，但需要把 SSR no-op 和 CSR 复用边界写清楚。

这组规则命中时，先判断该状态是不是确实需要模块级复用。需要复用时，把 source 放到规则允许的 client-only 边界；不需要复用时，把状态下沉到组件或页面 composable。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-ssr-unsafe-module-state`](../no-ssr-unsafe-module-state.md) | 提醒 Nuxt `use*` composable 里的模块级可变状态必须显式声明 SSR 策略。 |

## 相关阅读

- [别等 review 才想起 SSR：给 Nuxt 模块级 composable 补上静态护栏](https://shengsheng.fun/2026/07/16/nuxt-composable-ssr-guardrail/) 把模块级状态按业务数据、页面局部状态和跨组件 DOM 桥接拆开，给出对应 owner 和 SSR 处理口径。
