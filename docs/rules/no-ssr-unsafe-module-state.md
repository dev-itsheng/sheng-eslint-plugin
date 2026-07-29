---
ruleId: "@sheng/no-ssr-unsafe-module-state"
ruleName: "no-ssr-unsafe-module-state"
config: "nuxt-client-only-source"
---

# @sheng/no-ssr-unsafe-module-state

提醒 Nuxt use* composable 里的模块级可变状态必须显式声明 SSR 策略。

## 所属 config

- `nuxt-client-only-source`：Nuxt 模块级 SSR 不安全状态边界。

## 为什么需要

提醒 Nuxt use* composable 里的模块级可变状态必须显式声明 SSR 策略。

这条规则来自项目里的固定工程约定。接入前先用 `warn` 观察命中结果，再决定是否提升到 `error`。

## 适用边界

优先在已经采用 `nuxt-client-only-source` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

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
