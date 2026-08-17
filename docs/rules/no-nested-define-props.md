---
ruleId: "@sheng/no-nested-define-props"
ruleName: "no-nested-define-props"
config: "vue-script-setup"
---

# @sheng/no-nested-define-props

避免把 Vue `<script setup>` 的 defineProps() 包进普通运行时表达式，导致编译器宏没有被识别。

## 所属 config

- `vue-script-setup`：Vue `<script setup>` 宏和组件命名边界。

这条规则用于发现 Vue `<script setup>` 里把 `defineProps()` 包进普通运行时表达式的写法。

## 会被提示的写法

```vue
<script setup lang="ts">
import { toRefs } from 'vue'

interface Props {
  level: number
}

const { level } = toRefs(defineProps<Props>())
</script>
```

这段代码的变量初始化表达式最外层是 `toRefs(...)`，不是 Vue 编译器能识别的 `defineProps(...)` 宏入口。编译后 `defineProps()` 可能残留到运行时代码里，最终出现 `defineProps is not defined`。

## 推荐写法

```vue
<script setup lang="ts">
import { toRefs } from 'vue'

interface Props {
  level: number
}

const props = defineProps<Props>()
const { level } = toRefs(props)
</script>
```

如果项目已经使用 Vue 3.5 的响应式 props 解构，也可以直接写：

```ts
const { level } = defineProps<Props>()
```

需要默认值时，`withDefaults(defineProps(...), defaults)` 是 Vue 编译器明确支持的宏形态，规则会放过。

## 边界

- 只检查 `.vue` 文件里的 `<script setup>`。
- 允许 `defineProps()` 作为顶层变量初始化入口、顶层表达式入口，以及 `withDefaults()` 的第一个参数。
- 提示 `toRefs(defineProps(...))`、`toRef(defineProps(...), key)`、`readonly(defineProps(...))`、自定义函数包裹和条件表达式包裹。
- 默认不 autofix。大多数场景推荐拆成两步，但局部代码可能更适合 Vue 3.5 的直接解构，规则不替项目自动选择。

## 相关阅读

这条规则对应中文文章 [Vue script setup 中 defineProps 的编译边界与错误排查](https://shengsheng.fun/2026/05/23/vue-defineprops-macro-wrapper/)。文章里的核心结论是：Vue 编译器只识别顶层宏入口上的 `defineProps()`；一旦它被 `toRefs()`、自定义函数或条件表达式包起来，就会变成普通运行时调用。规则用 AST 检查复刻这条边界，把“宏没有被编译掉”的问题提前到编辑器里。

## 在线试一下

<RuleDemo rule="no-nested-define-props" />

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
      '@sheng/no-nested-define-props': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-nested-define-props/index.mjs`
- 规则短说明：`src/rules/no-nested-define-props/README.md`
- 测试用例：`tests/unit/architecture/`
