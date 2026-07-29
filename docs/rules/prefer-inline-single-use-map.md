---
ruleId: "@sheng/prefer-inline-single-use-map"
ruleName: "prefer-inline-single-use-map"
config: "project-style"
---

# @sheng/prefer-inline-single-use-map

提示只被索引读取一次的对象 / 数组映射表直接内联到使用处。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

提醒只被索引读取一次的对象 / 数组字面量映射表直接内联到使用处。

这条规则只做提醒，不做 autofix。原因是映射表里可能有注释、`satisfies` 类型约束或比较复杂的格式，自动改写容易损坏可读性；真正需要保留独立命名时，可以补第二个真实调用方，或在局部用 ESLint disable 写清原因。

## 触发场景

```ts
const iconSrcByType = {
  coin: coinSrc,
  diamond: pointsSrc,
} satisfies Record<CurrencyType, string>

const iconSrc = computed(() => iconSrcByType[type.value])
```

建议写成：

```ts
const iconSrc = computed(
  () =>
    (
      ({
        coin: coinSrc,
        diamond: pointsSrc,
      }) satisfies Record<CurrencyType, string>
    )[type.value],
)
```

## 不触发场景

同一张表被多处读取时，独立命名能表达共享边界，继续保留：

```ts
const iconSrcByType = {
  coin: coinSrc,
  diamond: pointsSrc,
}

const headerIconSrc = computed(() => iconSrcByType[headerType.value])
const footerIconSrc = computed(() => iconSrcByType[footerType.value])
```

对象只是状态拷贝、参数对象或直接传给函数时，不属于“单次索引映射”：

```ts
const nextMap = { ...remarksByUid.value }
nextMap[uid] = remark

const payload = { uid, remark }
await updateRemark(payload)
```

Vue template 里只读一次的映射表也不强制内联，因为在模板里塞对象字面量通常会降低可读性。

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
      '@sheng/prefer-inline-single-use-map': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/prefer-inline-single-use-map/index.mjs`
- 规则短说明：`src/rules/prefer-inline-single-use-map/README.md`
- 测试用例：`tests/unit/architecture/`
