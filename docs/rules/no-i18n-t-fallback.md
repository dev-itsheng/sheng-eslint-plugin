---
ruleId: "@sheng/no-i18n-t-fallback"
ruleName: "no-i18n-t-fallback"
config: "i18n"
---

# @sheng/no-i18n-t-fallback

禁止在 i18n 翻译函数调用里传 fallback，避免缺失 key 被调用点静默掩盖。

## 所属 config

- `i18n`：翻译 key、调用点 fallback 和用户可见中文文案约定。

翻译函数里的 `fallback` 会掩盖缺失 key。页面短期能显示文字，但文案来源会变成「语言包 + 调用点兜底」两套体系，QA、静态扫描和翻译平台都更难发现问题。

调用点兜底会改变文案来源。后续整理多语言时，维护者需要同时相信语言包和组件内部 fallback；页面显示正常也不能证明 key 已经进入正式翻译流程。

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

## 处理口径

命中这条规则时，优先判断当前文案所处阶段：

- 已有正式 key：删掉 fallback，只保留 `t('key')`。
- 还没有正式 key：不要临时塞 fallback，先把真实文案进入文案清单或语言包流程。
- 历史兼容层确实要兜底：把例外集中到项目 i18n 封装里，不要散落在每个组件调用点。

## 配置

默认检查 `t()`、`$t()` 和 `translateLegacy()`。如果项目没有 `translateLegacy()`，可以通过 `functionNames` 改成自己的翻译函数名单。

## 相关阅读

这条规则对应中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。文章里的核心结论是：调用点 fallback 会把文案来源拆成「语言包 + 组件局部兜底」两套体系；缺失 key 应该进入统一 i18n 流程，而不是被某个组件静默补掉。

## 在线试一下

<RuleDemo rule="no-i18n-t-fallback" />

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
