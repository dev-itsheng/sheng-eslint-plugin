---
ruleId: "@sheng/no-i18n-t-fallback"
ruleName: "no-i18n-t-fallback"
config: "project-style"
---

# @sheng/no-i18n-t-fallback

禁止在 i18n 翻译函数调用里传 fallback，避免缺失 key 被调用点静默掩盖。

## 所属 config

- `project-style`：项目风格、i18n、静态资源和类型可读性约定。

翻译函数里的 `fallback` 会掩盖缺失 key。页面短期能显示文字，但文案来源会变成「语言包 + 调用点兜底」两套体系，QA、静态扫描和翻译平台都更难发现问题。

## 会提示

```ts
t('profile_edit_title', { fallback: '基本信息' })
$t('string_save', { fallback: 'Save' })
```

## 推荐

```ts
t('profile_edit_title')
t('string_save')
```

没有 key 但设计稿已经给了具体文案时，直接保留真实文案并登记到文案流程，比临时造一个 key 再塞 fallback 更诚实。后续补齐语言包后，再统一替换成正式 key。

## 配置

默认检查 `t()`、`$t()` 和 `translateLegacy()`。如果项目没有 `translateLegacy()`，可以通过 `functionNames` 改成自己的翻译函数名单。

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
      '@sheng/no-i18n-t-fallback': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-i18n-t-fallback/index.mjs`
- 规则短说明：`src/rules/no-i18n-t-fallback/README.md`
- 测试用例：`tests/unit/architecture/`
