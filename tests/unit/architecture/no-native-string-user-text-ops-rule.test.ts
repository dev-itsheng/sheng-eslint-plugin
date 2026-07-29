import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, expect, it } from 'vitest'
import noNativeStringUserTextOps from '../../../src/rules/no-native-string-user-text-ops/index.mjs'
import { createRuleContextCompat } from '../../../src/rules/utils/eslint-rule-context.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('ESLint RuleContext 兼容层', () => {
  it('先检查 SourceCode 能力，再执行依赖 scope 的规则逻辑', () => {
    const sourceCode = {
      getText: () => 'nickname',
      getScope: () => ({ variables: [], upper: null }),
    }

    const context = createRuleContextCompat(
      {
        filename: '/repo/example.ts',
        cwd: '/repo',
        sourceCode,
        options: [],
        report: () => {},
      },
      'user-text/no-native-string-user-text-ops',
      {
        requireSourceCode: true,
        requiredSourceCodeMethods: ['getText', 'getScope'],
      },
    )

    expect(context.sourceCode).toBe(sourceCode)
    expect(context.filename).toBe('/repo/example.ts')
    expect(context.eslintRuleApiFamily).toBe('eslint-10-or-newer')

    expect(() =>
      createRuleContextCompat(
        {
          filename: '/repo/example.ts',
          cwd: '/repo',
          options: [],
          report: () => {},
        },
        'user-text/no-native-string-user-text-ops',
        {
          requireSourceCode: true,
          requiredSourceCodeMethods: ['getText', 'getScope'],
        },
      ),
    ).toThrow('context.sourceCode')
  })
})

describe('no-native-string-user-text-ops ESLint 规则', () => {
  it('在无类型信息时覆盖明显的字符串 length，同时放过数组等集合 length', () => {
    ruleTester.run('user-text/no-native-string-user-text-ops', noNativeStringUserTextOps, {
      valid: [
        'items.length',
        'items.slice(0, 2)',
        'errors.length === 0',
        'Object.keys(payload).length',
        'new Uint8Array(bytes).length',
        "const password = ref(''); password.value.length >= 6 && password.value.length <= 20",
        "const code = '1234'; code.length === 4",
        "const uid = '10001'; uid.length > 0",
        "const i18nKey = 'string_confirm'; i18nKey.trim().length > 0",
        "const path = '/profile/'; path.length > 1 && path.slice(0, -1)",
        "const hex = '00ff'; hex.length % 2 === 0 && hex.slice(0, 2)",
        'function parseDigestBytes(input) { const s = input.trim(); return s.length % 4 === 0 }',
        "function getFileExtension(file) { const fromName = file.name.split('.').pop(); return fromName && fromName.length <= 4 }",
        'countUnicodeCharacters(value)',
        'countTrimmedUnicodeCharacters(value)',
        'isUnicodeTextBlank(value)',
        'isUnicodeTextOverLimit(value, max)',
        'sliceUnicodeCharacters(value, start, end)',
        'substringUnicodeCharacters(value, start, end)',
        'truncateUnicodeCharacters(value, max)',
      ],
      invalid: [
        {
          code: "'🇯🇵'.length",
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: '`hello ${name}`.length',
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: 'nickname.trim().length === 0',
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: 'String(value).length',
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: "const nickname = 'Demo'; nickname.length",
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: "const nickname = ref(''); nickname.value.length",
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: "const codeTitle = 'Demo'; codeTitle.length",
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: "const nickname = 'Demo'; nickname.slice(0, 2)",
          errors: [{ messageId: 'noNativeStringMethod' }],
        },
        {
          code: "'🇯🇵Demo'.slice(0, 1)",
          errors: [{ messageId: 'noNativeStringMethod' }],
        },
        {
          code: "const nickname = 'Demo'; nickname.substring(0, 2)",
          errors: [{ messageId: 'noNativeStringMethod' }],
        },
        {
          code: "const nickname = 'Demo'; nickname.substr(0, 2)",
          errors: [{ messageId: 'noNativeStringMethod' }],
        },
        {
          code: "const nickname = 'Demo'; nickname.charAt(0)",
          errors: [{ messageId: 'noNativeStringMethod' }],
        },
      ],
    })
  })

  it('覆盖 Vue template 中明显的字符串 length', () => {
    ruleTester.run('user-text/no-native-string-user-text-ops-vue-template', noNativeStringUserTextOps, {
      valid: [
        {
          code: '<template>{{ items.length }}</template>',
          filename: 'valid.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
        {
          code: '<template><input type="password" maxlength="20" /></template>',
          filename: 'valid-password.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
        {
          code: '<template><input class="password-input" maxlength="20" /></template>',
          filename: 'valid-password-class.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
        {
          code: '<template><input v-model="code" maxlength="4" /></template>',
          filename: 'valid-code-model.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
        {
          code: '<template><input :maxlength="maxLength" /></template>',
          filename: 'valid-bound-maxlength.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: '<template>{{ title.trim().length }}</template>',
          filename: 'invalid.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noStringLength' }],
        },
        {
          code: '<template><input maxlength="20" /></template>',
          filename: 'invalid-maxlength-input.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noNativeMaxlength' }],
        },
        {
          code: '<template><textarea maxlength="200" /></template>',
          filename: 'invalid-maxlength-textarea.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noNativeMaxlength' }],
        },
        {
          code: '<template><input inputmode="search" maxlength="200" /></template>',
          filename: 'invalid-search-maxlength.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noNativeMaxlength' }],
        },
      ],
    })
  })

  it('支持按项目补充技术字段和用户文本字段名单', () => {
    ruleTester.run('user-text/no-native-string-user-text-ops-options', noNativeStringUserTextOps, {
      valid: [
        {
          code: "const sku = 'ABC'; sku.length",
          options: [{ technicalNamePatterns: ['\\bsku\\b'] }],
        },
      ],
      invalid: [
        {
          code: "const caption = 'Demo'; caption.slice(0, 2)",
          options: [{ userTextNamePatterns: ['\\bcaption\\b'] }],
          errors: [{ messageId: 'noNativeStringMethod' }],
        },
      ],
    })
  })
})
