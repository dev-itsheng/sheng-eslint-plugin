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

提醒不要把全局 composable 返回值原样透传给组件或页面私有 composable。

这条规则来自项目里的固定工程约定。接入前先用 `warn` 观察命中结果，再决定是否提升到 `error`。

## 适用边界

优先在已经采用 `composable-boundary` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

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
