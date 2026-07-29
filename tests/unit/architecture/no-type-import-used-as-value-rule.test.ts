import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noTypeImportUsedAsValue from '../../../src/rules/no-type-import-used-as-value/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-type-import-used-as-value ESLint 规则', () => {
  it('放过真正只在类型位置使用的 type-only import', () => {
    ruleTester.run('project-style/no-type-import-used-as-value-valid', noTypeImportUsedAsValue, {
      valid: [
        {
          code: `
            import type { AuthMode } from './types'
            interface Params { authMode: AuthMode }
            type Entry = AuthMode | null
            const value = {} as AuthMode
          `,
          languageOptions: {
            parser: tsParser,
          },
        },
        {
          code: `
            import { AuthMode, type SearchQuery } from './types'
            const mode = AuthMode.Guest
            type Query = SearchQuery
          `,
          languageOptions: {
            parser: tsParser,
          },
        },
        {
          code: `
            import type { AuthMode } from './types'
            function render(AuthMode: { Guest: string }) {
              return AuthMode.Guest
            }
          `,
          languageOptions: {
            parser: tsParser,
          },
        },
        {
          code: `
            import type { ScrollSnapshot } from './cache'
            export type { ScrollSnapshot }
          `,
          languageOptions: {
            parser: tsParser,
          },
        },
        {
          code: `
            import { type ScrollSnapshot } from './cache'
            export { type ScrollSnapshot }
          `,
          languageOptions: {
            parser: tsParser,
          },
        },
        {
          code: `
            <script setup lang="ts">
            import type { SearchQuery } from './types'
            defineProps<{ query: SearchQuery }>()
            </script>
          `,
          filename: 'app/components/common/ListPanel/index.vue',
          languageOptions: {
            parser: vueParser,
            parserOptions: {
              parser: tsParser,
            },
          },
        },
      ],
      invalid: [],
    })
  })

  it('提示 type-only import 被当运行时值使用', () => {
    ruleTester.run('project-style/no-type-import-used-as-value-invalid', noTypeImportUsedAsValue, {
      valid: [],
      invalid: [
        {
          code: `
            import type { AuthMode } from './types'
            const isGuest = authMode.value === AuthMode.Guest
          `,
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'noTypeImportUsedAsValue', data: { name: 'AuthMode' } }],
        },
        {
          code: `
            import { type AuthMode } from './types'
            const modeMap = { [AuthMode.Guest]: true }
          `,
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'noTypeImportUsedAsValue', data: { name: 'AuthMode' } }],
        },
        {
          code: `
            import type AuthMode from './types'
            const value = AuthMode.resolve()
          `,
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'noTypeImportUsedAsValue', data: { name: 'AuthMode' } }],
        },
        {
          code: `
            <script setup lang="ts">
            import type { AuthMode } from './types'
            const isGuest = authMode.value === AuthMode.Guest
            </script>
          `,
          filename: 'app/components/common/ListPanel/index.vue',
          languageOptions: {
            parser: vueParser,
            parserOptions: {
              parser: tsParser,
            },
          },
          errors: [{ messageId: 'noTypeImportUsedAsValue', data: { name: 'AuthMode' } }],
        },
      ],
    })
  })
})
