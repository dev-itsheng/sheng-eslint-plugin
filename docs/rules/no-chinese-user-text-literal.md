---
ruleId: "@sheng/no-chinese-user-text-literal"
ruleName: "no-chinese-user-text-literal"
config: "i18n"
---

# @sheng/no-chinese-user-text-literal

扫描运行时代码里的中文字面量；用户可见中文应使用已有 i18n key，待补文案进入项目文案清单。

## 所属 config

- `i18n`：翻译 key、调用点 fallback 和用户可见中文文案约定。

扫描运行时代码里的中文字面量，帮助把用户可见文案迁移到 i18n。

这条规则适合按目录临时扫描，不建议一开始全仓默认开启：

```bash
pnpm exec eslint app/components/common/Profile --ext .vue,.ts --rule '@sheng/no-chinese-user-text-literal: warn'
```

裸中文文案不一定每次都是错误。早期功能可能会先按设计稿落中文，再等语言平台补齐 key。规则的价值是让这些文案进入清单，而不是散在组件、工具函数或模板静态属性里，最后只能靠人肉搜索。

## 规则边界

- 检查 JS / TS 字符串字面量、模板字符串静态片段、Vue template 文本和静态属性。
- 不检查注释，因为很多项目会允许中文注释。
- 不检查 import / export source。
- 不检查 TypeScript 类型字面量。

命中的内容不一定马上改代码。先确认这段文字是否用户可见、是否已经有 i18n key，再决定替换或登记到项目文案清单。

## 会提示

```vue
<script setup lang="ts">
const submitText = '保存'
const titleText = computed(() => `编辑${profileName.value}`)
</script>

<template>
  <h2>基本信息</h2>
  <button title="保存资料">{{ submitText }}</button>
</template>
```

## 推荐处理

已有正式 key 时，直接替换成项目 i18n 调用：

```vue
<script setup lang="ts">
const submitText = t('profile_edit_save')
const titleText = computed(() => t('profile_edit_title', { name: profileName.value }))
</script>

<template>
  <h2>{{ t('profile_edit_basic_info') }}</h2>
  <button :title="t('profile_edit_save_title')">{{ submitText }}</button>
</template>
```

还没有正式 key 时，先把文案登记到项目文案清单，再按项目流程补语言包。不要为了绕过规则临时造 key，也不要把中文文案藏进 fallback。

## 使用建议

这条规则更像迁移工具。新项目可以在业务目录开启；历史项目建议按页面、组件目录或 feature 分批扫描。每一批先把候选文案整理成清单，再决定替换成现有 key、补新 key，或用局部 disable 记录维护者可见文本。

## 相关阅读

这条规则的方法论背景见中文文章 [Skill 管不住代码风格时：把项目约定写成 ESLint 护栏](https://shengsheng.fun/2026/07/24/agent-code-style-eslint-guardrails/)。具体触发条件、示例、配置和维护入口以本页为准。

## 在线试一下

<RuleDemo rule="no-chinese-user-text-literal" />

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
