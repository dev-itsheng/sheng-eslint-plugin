---
ruleId: "@sheng/no-type-import-used-as-value"
ruleName: "no-type-import-used-as-value"
config: "type-readability"
---

# @sheng/no-type-import-used-as-value

提示 type-only import 不能在运行时表达式里当值使用。

## 所属 config

- `type-readability`：TypeScript 运行时值、映射表和轻量 computed 的可读性约定。

`import type` 引入的符号只存在于类型空间，不能在运行时表达式里当值使用。TypeScript 有时能在构建阶段报错，但在 Vue SFC、临时脚本或局部迁移里，提前用 ESLint 打标会更直接。

这条规则比多数风格规则更硬。命中时通常说明代码把类型空间的名字拿到了运行时表达式里，已经触及运行时边界。业务项目确认 parser 配置正常后，可以考虑把它升成 `error`。

## 会提示

```ts
import type { AuthMode } from './types'

const isGuest = authMode.value === AuthMode.Guest
```

## 推荐

```ts
import { AuthMode } from './types'

const isGuest = authMode.value === AuthMode.Guest
```

如果 `AuthMode` 只用于类型标注，继续保留 `import type`。

## 判断口径

- 符号只用于类型标注、泛型参数、接口继承：继续使用 `import type`。
- 符号用于枚举值、静态成员、`instanceof`、对象属性读取、函数调用：改成普通 import。
- 同一个来源同时有类型和值：拆成 `import type { ... }` 和 `import { ... }`，保持运行时边界清楚。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：`import type` 引入的符号只存在于类型空间，拿它访问 enum member、静态成员或运行时属性已经触及运行时错误风险；ESLint 可以比构建更早在编辑器里打标。

## 在线试一下

<RuleDemo rule="no-type-import-used-as-value" />

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
      '@sheng/no-type-import-used-as-value': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-type-import-used-as-value/index.mjs`
- 规则短说明：`src/rules/no-type-import-used-as-value/README.md`
- 测试用例：`tests/unit/architecture/`
