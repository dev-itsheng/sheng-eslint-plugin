---
ruleId: "@sheng/no-dynamic-i18n-t-key"
ruleName: "no-dynamic-i18n-t-key"
config: "i18n"
---

# @sheng/no-dynamic-i18n-t-key

要求 i18n 的 t() 第一个参数必须是字符串字面量，保证 IDE 插件和静态扫描能识别真实 key。

## 所属 config

- `i18n`：翻译 key、调用点 fallback 和用户可见中文文案约定。

`t()` / `$t()` 的第一个参数如果是动态表达式，IDE 插件、静态扫描和翻译平台都看不到真实 key。缺失文案、拼错 key 和未翻译内容会被推迟到运行时才暴露。

这条规则不反对“根据状态切换文案”，它只要求每个候选 key 都能静态出现在代码里。显式分支看起来比模板字符串啰嗦一点，但 i18n key 会继续被补全、跳转、扫描和缺失检查识别。

## 会提示

```ts
t(`profile_${field}_label`)
t(labelKey)
t(keys.save)
```

## 推荐

```ts
const title = computed(() => {
  if (activeSection.value === 'birthday') return t('profile_edit_birthday_title')
  if (activeSection.value === 'height') return t('profile_edit_height_title')
  return t('profile_edit_title')
})
```

每个 key 都紧贴 `t()`，工具链才能扫描、补全和跳转。需要根据状态切换文案时，显式列出分支比拼接 key 更容易维护。

## 不处理的场景

这条规则只检查翻译函数第一个参数的静态形态，不判断 key 是否真实存在，也不负责补齐语言包。缺失 key、未翻译文案和多语言同步仍然应该交给 i18n 平台、字典扫描或项目自己的语言包校验。

## 配置

默认检查 `t()` 和 `$t()`，也能追踪 `useAppI18n()` 解构出的别名。项目里有其他翻译函数时，通过 `functionNames` 补充。

## 相关阅读

这条规则的方法论背景见中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。具体触发条件、示例、配置和维护入口以本页为准。

## 在线试一下

<RuleDemo rule="no-dynamic-i18n-t-key" />

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
      '@sheng/no-dynamic-i18n-t-key': 'warn',
    },
  },
]
```

## 选项

这条规则支持 options，具体 schema 以规则实现和测试用例为准。补充或调整选项时，同步更新本页示例。

## 维护入口

- 规则源码：`src/rules/no-dynamic-i18n-t-key/index.mjs`
- 规则短说明：`src/rules/no-dynamic-i18n-t-key/README.md`
- 测试用例：`tests/unit/architecture/`
