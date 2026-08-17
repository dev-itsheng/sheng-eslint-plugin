---
ruleId: "@sheng/no-ssr-unsafe-module-state"
ruleName: "no-ssr-unsafe-module-state"
config: "nuxt-ssr-state"
---

# @sheng/no-ssr-unsafe-module-state

提醒 Nuxt use* composable 里的模块级可变状态必须显式声明 SSR 策略。

## 所属 config

- `nuxt-ssr-state`：Nuxt 模块级 SSR 不安全状态边界。

## 为什么需要

Nuxt 服务端渲染下，模块级可变状态可能在请求之间共享。业务数据、页面局部状态和跨组件 DOM 桥接应该有不同 owner；如果确实需要模块级 source，就要让目录或文件名显式表达 client-only 边界。

## 会提示

```ts
const tabBarIsSticky = ref(false)
const scrollRootElement = shallowRef<HTMLElement | null>(null)

export default function useProfileStickyState() {
  return {
    scrollRootElement,
    tabBarIsSticky,
  }
}
```

## 推荐写法

可序列化业务数据优先放到 Pinia、`useState` 或请求缓存。页面局部状态放在组件 setup 内创建：

```ts
export default function useProfileStickyState() {
  const tabBarIsSticky = ref(false)
  const scrollRootElement = shallowRef<HTMLElement | null>(null)

  return {
    scrollRootElement,
    tabBarIsSticky,
  }
}
```

跨组件 DOM 桥接如果确实需要模块级 source，需要放进项目约定的 client-only 边界，并让 SSR 返回 no-op。

## 适用边界

优先在已经采用 `nuxt-ssr-state` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

## 相关阅读

这条规则对应中文文章 [别等 review 才想起 SSR：给 Nuxt 模块级 composable 补上静态护栏](https://shengsheng.fun/2026/07/16/nuxt-composable-ssr-guardrail/)。文章里的核心口径是：模块级状态先按可序列化业务数据、页面局部状态、跨组件 DOM 桥接分类，再分别选择 Pinia / `useState`、组件 setup 或显式 client-only source。

## 在线试一下

<RuleDemo rule="no-ssr-unsafe-module-state" />

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
      '@sheng/no-ssr-unsafe-module-state': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-ssr-unsafe-module-state/index.mjs`
- 规则短说明：`src/rules/no-ssr-unsafe-module-state/README.md`
- 测试用例：`tests/unit/architecture/`
