import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noDynamicI18nTKey from '../../../src/rules/no-dynamic-i18n-t-key/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-dynamic-i18n-t-key ESLint 规则', () => {
  it('要求 t() / $t() 的第一个参数是字符串字面量', () => {
    ruleTester.run('project-style/no-dynamic-i18n-t-key', noDynamicI18nTKey, {
      valid: [
        "t('string_save')",
        "t('hello', { name: userName })",
        "$t('string_save')",
        "i18n.t('string_save')",
        "({ save: t('string_save'), cancel: t('cancel') })[action]",
        "tOrFallback(key, undefined, 'Save')",
        'translateLegacy(key)',
      ],
      invalid: [
        {
          code: 't(key)',
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: "t(condition ? 'string_save' : 'cancel')",
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: 't(`settings_level_${level}_label`)',
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: 't(STRING_SAVE_KEY)',
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: 't()',
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: 'i18n.t(key)',
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: 'const { t: translate } = useAppI18n(); translate(key)',
          errors: [{ messageId: 'literalKey' }],
        },
        {
          code: 'const translate = useAppI18n().t; translate(key)',
          errors: [{ messageId: 'literalKey' }],
        },
      ],
    })
  })

  it('覆盖 Vue template 里的动态 t key', () => {
    ruleTester.run('project-style/no-dynamic-i18n-t-key-vue-template', noDynamicI18nTKey, {
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
          code: '<template>{{ t(key) }}</template>',
          filename: 'invalid.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'literalKey' }],
        },
      ],
    })
  })
})
