---
ruleId: "@sheng/no-flat-private-child-module"
ruleName: "no-flat-private-child-module"
config: "composable-boundary"
---

# @sheng/no-flat-private-child-module

提示只有单一父调用方的私有 composable / component 不要和父文件平铺在同一个目录。

## 所属 config

- `composable-boundary`：Composable 公开面、私有模块和 UI 层依赖边界。

## 为什么需要

只有单一父调用方的私有 composable 或组件，应该通过目录结构表达归属关系。父模块和子模块平铺在同一个目录里，会把私有子流程伪装成同级公共能力，后续调用方很难判断哪个文件可以复用，哪个文件只能跟着父模块移动。

## 会提示

```text
composables/
  useFeatureState.ts
  useFeatureColumns.ts
```

```ts
// useFeatureState.ts
import useFeatureColumns from './useFeatureColumns'

export default function useFeatureState() {
  const columns = useFeatureColumns()
  return { columns }
}
```

如果 `useFeatureColumns.ts` 只被 `useFeatureState.ts` 使用，规则会提示它们不应该平铺。

组件也有同类问题：

```vue
<template>
  <FeatureActions />
</template>
```

当 `FeatureActions.vue` 只服务 `FeaturePanel.vue` 时，它更像 `FeaturePanel` 的私有子组件。

## 推荐写法

```text
composables/
  useFeatureState/
    index.ts
    useFeatureColumns.ts
```

```ts
// useFeatureState/index.ts
import useFeatureColumns from './useFeatureColumns'

export default function useFeatureState() {
  const columns = useFeatureColumns()
  return { columns }
}
```

## 适用边界

优先在已经采用 `composable-boundary` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

## 相关阅读

这条规则对应中文文章 [Composable 的公开面别靠默契：用 ESLint 守住私有模块边界](https://shengsheng.fun/2026/07/24/composable-module-boundary-eslint-guardrails/)。文章里的核心判断是：私有子模块应该让目录结构表达 owner；父能力改成文件夹 facade 后，子流程就不会被误读成同级公共能力。

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
      '@sheng/no-flat-private-child-module': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-flat-private-child-module/index.mjs`
- 规则短说明：`src/rules/no-flat-private-child-module/README.md`
- 测试用例：`tests/unit/architecture/`
