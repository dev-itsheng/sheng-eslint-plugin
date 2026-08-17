export const ruleGroups = {
  'vue-script-setup': [
    'no-nested-define-props',
    'no-component-name-conflict',
  ],
  i18n: [
    'no-dynamic-i18n-t-key',
    'no-i18n-t-fallback',
    'no-chinese-user-text-literal',
  ],
  'unicode-user-text': [
    'no-native-string-user-text-ops',
  ],
  'nuxt-auto-import': [
    'no-explicit-vue-api-import',
    'no-explicit-vue-component-import',
  ],
  'enum-public-api': [
    'no-enum-prop-type',
    'no-template-enum-member-alias',
  ],
  'nuxt-ssr-state': [
    'no-ssr-unsafe-module-state',
  ],
  'composable-boundary': [
    'no-extra-composable-exports',
    'no-flat-private-child-module',
    'no-global-composable-import-ui-layer',
    'no-global-composable-pass-through',
    'no-nested-vue-context-composable',
  ],
  'component-resource-style': [
    'no-dom-query-in-component',
    'no-missing-static-asset-import',
    'no-static-px-inline-style',
  ],
  'vue-reactivity': [
    'no-redundant-watch-source-compare',
    'prefer-to-refs-props',
  ],
  'type-readability': [
    'no-type-import-used-as-value',
    'no-redundant-indexed-record-satisfies',
    'prefer-keyed-object-map',
    'prefer-inline-single-use-map',
    'prefer-inline-trivial-computed',
  ],
  'load-more-trigger': [
    'prefer-load-more-trigger',
  ],
}

export const ruleGroupDetails = {
  'vue-script-setup': {
    label: 'Vue script setup',
    summary: 'Vue script setup 宏和模板名称解析边界。',
  },
  i18n: {
    label: 'i18n',
    summary: '翻译 key、调用点 fallback 和用户可见中文文案约定。不涉及国际化的项目可以跳过这一组。',
  },
  'unicode-user-text': {
    label: 'Unicode 用户文本',
    summary: '用户可见文本的 Unicode 字符数和截断护栏。',
  },
  'nuxt-auto-import': {
    label: 'Nuxt 自动导入',
    summary: 'Nuxt 组件和 Vue API 自动导入约定。',
  },
  'enum-public-api': {
    label: 'enum 公开 API',
    summary: '公开字符串调用面里的 enum 使用边界。',
  },
  'nuxt-ssr-state': {
    label: 'Nuxt SSR 状态',
    summary: 'Nuxt 模块级 SSR 不安全状态边界。',
  },
  'composable-boundary': {
    label: 'composable 边界',
    summary: 'Composable 公开面、私有模块和 UI 层依赖边界。',
  },
  'component-resource-style': {
    label: '组件与资源约定',
    summary: '组件 DOM owner、静态样式和静态资源 import 的项目约定。',
  },
  'vue-reactivity': {
    label: 'Vue 响应式写法',
    summary: 'Vue watch、props 读取形态这类响应式代码约定。',
  },
  'type-readability': {
    label: '类型和可读性',
    summary: 'TypeScript 运行时值、映射表和轻量 computed 的可读性约定。',
  },
  'load-more-trigger': {
    label: '触底加载',
    summary: '无限滚动触底触发器复用约定。',
  },
}
