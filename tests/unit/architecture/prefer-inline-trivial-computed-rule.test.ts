import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import preferInlineTrivialComputed from '../../../src/rules/prefer-inline-trivial-computed/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

const vueLanguageOptions = {
  parser: vueParser,
  parserOptions: {
    parser: tsParser,
  },
}

describe('prefer-inline-trivial-computed ESLint 规则', () => {
  it('提示只包一层静态 i18n 调用的 computed', () => {
    ruleTester.run('project-style/prefer-inline-trivial-computed-invalid', preferInlineTrivialComputed, {
      valid: [],
      invalid: [
        {
          code: "const titleText = computed(() => t('string_save'))",
          errors: [{ messageId: 'preferInlineTrivialComputed' }],
        },
        {
          code: "const titleText = computed(() => translateLegacy('settings_points_title'))",
          errors: [{ messageId: 'preferInlineTrivialComputed' }],
        },
        {
          code: "const titleText = computed(function () { return $t('string_save') })",
          errors: [{ messageId: 'preferInlineTrivialComputed' }],
        },
        {
          code: "const titleText = computed(() => i18n.t('string_save'))",
          errors: [{ messageId: 'preferInlineTrivialComputed' }],
        },
        {
          code: `
            <script setup lang="ts">
            const titleText = computed(() => translateLegacy('settings_points_title'))
            </script>
          `,
          filename: 'app/components/common/Profile/Card/index.vue',
          languageOptions: vueLanguageOptions,
          errors: [{ messageId: 'preferInlineTrivialComputed' }],
        },
      ],
    })
  })

  it('提示只包一层简单模板 class map 的 computed', () => {
    ruleTester.run('project-style/prefer-inline-trivial-computed-class-map-invalid', preferInlineTrivialComputed, {
      valid: [],
      invalid: [
        {
          code: `
            const rootClass = computed(() => ({
              'profile-card--is-premium': isPremium.value,
              'profile-card--is-rule': viewMode.value === 'rule',
            }))
          `,
          errors: [{ messageId: 'preferInlineTrivialClassComputed' }],
        },
        {
          code: `
            <script setup lang="ts">
            const rootClasses = computed(() => ({
              'profile-card--is-active': active.value,
              'profile-card--is-locked': !available.value,
            }))
            </script>
          `,
          filename: 'app/components/profile/Card/index.vue',
          languageOptions: vueLanguageOptions,
          errors: [{ messageId: 'preferInlineTrivialClassComputed' }],
        },
      ],
    })
  })

  it('保留包含真实派生逻辑的 class computed', () => {
    ruleTester.run('project-style/prefer-inline-trivial-computed-class-map-valid', preferInlineTrivialComputed, {
      valid: [
        `
          const rootClass = computed(() => ({
            'profile-card--has-dynamic-theme': resolveThemeClass(theme.value),
          }))
        `,
        `
          const itemClass = computed(() => buildItemClass(item.value))
        `,
      ],
      invalid: [],
    })
  })

  it('保留有真实派生逻辑或动态输入的 computed', () => {
    ruleTester.run('project-style/prefer-inline-trivial-computed-valid', preferInlineTrivialComputed, {
      valid: [
        "const scoreText = computed(() => new Intl.NumberFormat('en-US').format(scoreBalance.value))",
        'const titleText = computed(() => t(titleKey.value))',
        "const titleText = computed(() => t('string_save', { name: userName.value }))",
        "const titleText = computed(() => (isPremium.value ? t('premium_title') : t('normal_title')))",
        "const titleText = translateLegacy('settings_points_title')",
        {
          code: `
            <script setup lang="ts">
            const scoreText = computed(() => new Intl.NumberFormat('en-US').format(scoreBalance.value))
            </script>
          `,
          filename: 'app/components/common/Profile/Card/index.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('允许项目按函数名收窄检查范围', () => {
    ruleTester.run('project-style/prefer-inline-trivial-computed-options', preferInlineTrivialComputed, {
      valid: [
        {
          code: "const titleText = computed(() => translateLegacy('settings_points_title'))",
          options: [{ i18nFunctionNames: ['legacyText'], classMapVariableNames: ['panelClassMap'] }],
        },
      ],
      invalid: [
        {
          code: "const titleText = computed(() => legacyText('settings_points_title'))",
          options: [{ i18nFunctionNames: ['legacyText'], classMapVariableNames: ['panelClassMap'] }],
          errors: [{ messageId: 'preferInlineTrivialComputed' }],
        },
        {
          code: "const panelClassMap = computed(() => ({ 'panel--active': active.value }))",
          options: [{ classMapVariableNames: ['panelClassMap'] }],
          errors: [{ messageId: 'preferInlineTrivialClassComputed' }],
        },
      ],
    })
  })
})
