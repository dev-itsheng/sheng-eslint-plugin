---
ruleId: "@sheng/no-redundant-watch-source-compare"
ruleName: "no-redundant-watch-source-compare"
config: "project-style"
---

# @sheng/no-redundant-watch-source-compare

禁止在单 source watch 回调中冗余比较 next value 和 previous value。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

## 背景

Vue 的单 source `watch(source, (next, previous) => {})` 只有在 source 的值发生变化时才会执行。因此在回调开头再写：

```ts
watch(activeTab, (nextTab, previousTab) => {
  if (nextTab === previousTab) return
  reload()
})
```

这个判断是冗余的。它不会增加安全性，只会让后续维护者误以为 watch 可能在“值没变”时触发，或者误把真正的业务条件藏在无意义的 guard 后面。

这类冗余判断在大组件里尤其容易变成噪音：读代码的人要先理解一层“其实永远不会发生”的分支，才能看到真实业务逻辑。

## 检查范围

规则只检查简单、确定的场景：

- `watch(singleSource, (next, previous) => { ... })`
- 回调内部直接比较 `next === previous`、`next !== previous`、`next == previous`、`next != previous`

它不会检查以下场景：

- 多 source watch：`watch([a, b], ([nextA], [previousA]) => {})`
- deep watch：`watch(source, callback, { deep: true })`
- 没有 `next / previous` 两个标识符参数的回调
- 嵌套函数里的比较

这些场景的触发语义更复杂，规则先不碰，避免误报。

## 正确写法

删除冗余比较，只保留真正的业务条件：

```ts
watch(activeTab, (nextTab) => {
  reloadTab(nextTab)
})
```

如果业务上确实想比较某个派生字段，不要比较整个 source 值，而是写清楚具体条件：

```ts
watch(userProfile, (nextProfile, previousProfile) => {
  if (nextProfile.uid === previousProfile.uid) return
  refreshProfileResources(nextProfile.uid)
})
```

上面这种比较的是对象内部字段，不是 `nextProfile === previousProfile`，规则不会拦。

## 为什么不自动修复

这条规则暂时不提供 auto-fix。原因是冗余比较常常和业务代码写在一起，例如：

```ts
if (next === previous || loading.value) return
```

自动删除其中一半容易改变换行、注释和逻辑结构。当前更稳妥的方式是提示开发者手动删掉冗余判断，并顺手确认剩余条件是否表达了真实业务语义。

## 维护方式

- 如果后续要支持 auto-fix，先补复杂布尔表达式测试。
- 如果要扩展到 deep watch 或多 source watch，必须先证明 Vue 触发语义和当前规则一致；否则容易误报。
- 如果业务确实需要允许某个比较，优先确认它是否应该改成字段级比较，而不是直接禁用规则。

## 对应测试

测试文件是 `tests/unit/architecture/no-redundant-watch-source-compare-rule.test.ts`。新增 AST 支持范围时，先补 valid / invalid case 再改规则。

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
      '@sheng/no-redundant-watch-source-compare': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-redundant-watch-source-compare/index.mjs`
- 规则短说明：`src/rules/no-redundant-watch-source-compare/README.md`
- 测试用例：`tests/unit/architecture/`
