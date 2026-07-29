---
ruleId: "@sheng/no-chinese-user-text-literal"
ruleName: "no-chinese-user-text-literal"
config: "project-style"
---

# @sheng/no-chinese-user-text-literal

扫描运行时代码里的中文字面量；用户可见中文应使用已有 i18n key，待补文案进入项目文案清单。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

扫描运行时代码里的中文字面量，帮助把用户可见文案迁移到 i18n。

这条规则适合按目录临时扫描，不建议一开始全仓默认开启：

```bash
pnpm exec eslint app/components/common/Profile --ext .vue,.ts --rule '@sheng/no-chinese-user-text-literal: warn'
```

## 规则边界

- 检查 JS / TS 字符串字面量、模板字符串静态片段、Vue template 文本和静态属性。
- 不检查注释，因为很多项目会允许中文注释。
- 不检查 import / export source。
- 不检查 TypeScript 类型字面量。

命中的内容不一定马上改代码。先确认这段文字是否用户可见、是否已经有 i18n key，再决定替换或登记到项目文案清单。

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
      '@sheng/no-chinese-user-text-literal': 'warn',
    },
  },
]
```

## 选项

当前没有 options。

## 维护入口

- 规则源码：`src/rules/no-chinese-user-text-literal/index.mjs`
- 规则短说明：`src/rules/no-chinese-user-text-literal/README.md`
- 测试用例：`tests/unit/architecture/`
