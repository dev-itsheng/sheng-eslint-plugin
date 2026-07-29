---
ruleId: "@sheng/prefer-to-refs-props"
ruleName: "prefer-to-refs-props"
config: "project-style"
---

# @sheng/prefer-to-refs-props

提醒组件脚本里不要直接读取 props.xxx 或 toRef(props, key)，统一先 toRefs(props)。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

提醒组件脚本里不要混用 `props.xxx` 和 `toRef(props, key)`，统一先 `toRefs(props)` 后再使用对应 Ref。

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
