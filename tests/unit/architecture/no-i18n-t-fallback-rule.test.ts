import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noI18nTFallback from '../../../src/rules/no-i18n-t-fallback/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-i18n-t-fallback ESLint 规则', () => {
  it('禁止 t() / $t() / translateLegacy() 直接传 fallback', () => {
    ruleTester.run('project-style/no-i18n-t-fallback', noI18nTFallback, {
      valid: ["t('string_save')", "t('hello', { name: userName })", "tOrFallback('string_save', undefined, 'Save')", "translateLegacy('premium_title')", "translateLegacy('premium_title', { AA: level })"],
      invalid: [
        {
          code: "t('string_save', { fallback: 'Save' })",
          errors: [{ messageId: 'noFallback' }],
        },
        {
          code: "$t('string_save', { fallback: 'Save' })",
          errors: [{ messageId: 'noFallback' }],
        },
        {
          code: "i18n.t('string_save', { fallback: 'Save' })",
          errors: [{ messageId: 'noFallback' }],
        },
        {
          code: "const { t: translate } = useAppI18n(); translate('string_save', { fallback: 'Save' })",
          errors: [{ messageId: 'noFallback' }],
        },
        {
          code: "const translate = useAppI18n().t; translate('string_save', { fallback: 'Save' })",
          errors: [{ messageId: 'noFallback' }],
        },
        {
          code: "translateLegacy('premium_title', { fallback: 'Premium' })",
          errors: [{ messageId: 'noFallback' }],
        },
      ],
    })
  })

  it('覆盖 Vue template 里的 t fallback', () => {
    ruleTester.run('project-style/no-i18n-t-fallback-vue-template', noI18nTFallback, {
      valid: [
        {
          code: "<template>{{ t('string_save') }}</template>",
          filename: 'valid.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: "<template>{{ t('string_save', { fallback: 'Save' }) }}</template>",
          filename: 'invalid.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noFallback' }],
        },
        {
          code: "<template>{{ translateLegacy('premium_title', { fallback: 'Premium' }) }}</template>",
          filename: 'invalid-h5.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noFallback' }],
        },
      ],
    })
  })
})
