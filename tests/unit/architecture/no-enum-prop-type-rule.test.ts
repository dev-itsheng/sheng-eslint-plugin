import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import noEnumPropType from '../../../src/rules/no-enum-prop-type/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-enum-prop-type ESLint 规则', () => {
  it('只提醒被配置为 string-compatible 边界的 enum prop', () => {
    ruleTester.run('enum-public-api/no-enum-prop-type', noEnumPropType, {
      valid: [
        {
          code: `
            const enum DialogMode { Prompt = 'prompt' }
            type DialogModeValue = \`\${DialogMode}\`
            defineProps<{ mode: DialogModeValue }>()
          `,
          filename: '/repo/app/components/common/Dialog/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          options: [{ disallowedEnumNames: ['DialogMode'] }],
        },
        {
          code: `
            const enum DialogMode { Prompt = 'prompt' }
            defineProps<{ mode: \`\${DialogMode}\` }>()
          `,
          filename: '/repo/app/components/common/Dialog/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          options: [{ disallowedEnumNames: ['DialogMode'] }],
        },
        {
          code: `
            const enum InternalDialogState { Mounted = 'mounted' }
            defineProps<{ state: InternalDialogState }>()
          `,
          filename: '/repo/app/components/common/Dialog/InternalState.vue',
          languageOptions: {
            parser: tsParser,
          },
          options: [{ disallowedEnumNames: ['DialogMode'] }],
        },
        {
          code: "defineProps<{ mode: 'alert' | 'confirm' | 'prompt' }>()",
          filename: '/repo/app/components/common/Dialog/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          options: [{ disallowedEnumNames: ['DialogMode'] }],
        },
      ],
      invalid: [
        {
          code: `
            const enum DialogMode { Prompt = 'prompt' }
            defineProps<{ mode: DialogMode }>()
          `,
          filename: '/repo/app/components/common/Dialog/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          options: [{ disallowedEnumNames: ['DialogMode'] }],
          errors: [{ messageId: 'noEnumPropType', data: { propName: 'mode', enumName: 'DialogMode' } }],
        },
        {
          code: `
            enum BadgeKind { Verified = 'verified' }
            interface Props { kind: BadgeKind }
            defineProps<Props>()
          `,
          filename: '/repo/app/components/common/Badge/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          options: [{ disallowedEnumNames: ['BadgeKind'] }],
          errors: [{ messageId: 'noEnumPropType', data: { propName: 'kind', enumName: 'BadgeKind' } }],
        },
      ],
    })
  })
})
