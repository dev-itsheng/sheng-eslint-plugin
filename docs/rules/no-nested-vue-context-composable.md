---
ruleId: "@sheng/no-nested-vue-context-composable"
ruleName: "no-nested-vue-context-composable"
config: "composable-boundary"
---

# @sheng/no-nested-vue-context-composable

限制依赖当前 Vue/Nuxt 上下文的 API 只能在 setup 或 use*.ts composable 主函数顶层同步调用。

## 所属 config

- `composable-boundary`：Composable 公开面、私有模块和 UI 层依赖边界。

## 为什么需要

`useRoute()`、`useRouter()`、`useNuxtApp()`、`inject()`、`useState()` 这类 API 依赖当前组件实例、Nuxt app 或请求上下文。它们不应该被放进内部函数、事件回调、`watch` 回调、条件分支或 `await` 之后。

推荐做法是在 `setup` 或主 composable 顶层同步读取上下文能力，再通过闭包交给后续函数使用。

## 会提示

```ts
export default function useFeatureNavigation() {
  function openFeature(id: string) {
    const router = useRouter()
    router.push('/feature/' + id)
  }

  return { openFeature }
}
```

`await` 之后读取上下文能力也会提示：

```ts
export default async function useFeatureNavigation() {
  await refreshSession()
  const route = useRoute()
  return { route }
}
```

## 推荐写法

```ts
export default function useFeatureNavigation() {
  const router = useRouter()

  function openFeature(id: string) {
    router.push('/feature/' + id)
  }

  return { openFeature }
}
```

## 适用边界

优先在已经采用 `composable-boundary` 约定的项目里开启。历史代码较多时，先按目录或文件范围试跑，确认误报成本可以接受。

## 相关阅读

这条规则对应中文文章 [Composable 的公开面别靠默契：用 ESLint 守住私有模块边界](https://shengsheng.fun/2026/07/24/composable-module-boundary-eslint-guardrails/)。文章里的核心口径是：上下文 API 先在主边界顶层同步调用，再通过闭包给内部函数使用；它们不是可以随时调用的普通工具函数。

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
      '@sheng/no-nested-vue-context-composable': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-nested-vue-context-composable/index.mjs`
- 规则短说明：`src/rules/no-nested-vue-context-composable/README.md`
- 测试用例：`tests/unit/architecture/`
