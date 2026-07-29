---
ruleId: "@sheng/no-type-import-used-as-value"
ruleName: "no-type-import-used-as-value"
config: "project-style"
---

# @sheng/no-type-import-used-as-value

提示 type-only import 不能在运行时表达式里当值使用。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

`import type` 引入的符号只存在于类型空间，不能在运行时表达式里当值使用。TypeScript 有时能在构建阶段报错，但在 Vue SFC、临时脚本或局部迁移里，提前用 ESLint 打标会更直接。

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
