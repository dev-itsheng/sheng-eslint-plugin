---
ruleId: "@sheng/prefer-to-refs-props"
ruleName: "prefer-to-refs-props"
config: "vue-reactivity"
---

# @sheng/prefer-to-refs-props

提醒组件脚本里不要直接读取 props.xxx 或 toRef(props, key)，统一先 toRefs(props)。

## 所属 config

- `vue-reactivity`：Vue watch、props 读取形态这类响应式代码约定。

提醒组件脚本里不要混用 `props.xxx` 和 `toRef(props, key)`，统一先 `toRefs(props)` 后再使用对应 Ref。

这条规则属于项目风格约束，目标是统一组件脚本里的 props 读取形态。项目如果约定 composable 参数和组件内部状态都以 Ref 传递，那么 `props.xxx`、`toRef(props, key)` 和 `toRefs(props)` 混在一起会增加阅读成本。

## 会提示

```ts
const props = defineProps<{ name: string }>()
console.log(props.name)

const name = toRef(props, 'name')
```

## 推荐

```ts
const props = defineProps<{ name: string }>()
const { name } = toRefs(props)

console.log(name.value)
```

这条规则属于项目风格约束，适合团队希望组件内部和 composable 参数都统一使用 Ref 入口的场景。

## 使用边界

这条规则不是 Vue 官方最佳实践的唯一答案。小组件里直接读 `props.xxx` 本身可以工作；只有当团队希望组件脚本统一围绕 Ref 组织状态，并且 composable 入参也按 Ref 设计时，才适合开启这条规则。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：项目约定先 `toRefs(props)` 时，同一类组件里继续混用 `props.xxx`、`toRef(props, key)` 和 Ref 参数会增加阅读成本；这条规则是团队风格护栏，不是 Vue 官方唯一写法。

## 在线试一下

<RuleDemo rule="prefer-to-refs-props" />

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
      '@sheng/prefer-to-refs-props': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/prefer-to-refs-props/index.mjs`
- 规则短说明：`src/rules/prefer-to-refs-props/README.md`
- 测试用例：`tests/unit/architecture/`
