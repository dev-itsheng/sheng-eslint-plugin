import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noTemplateEnumMemberAlias from '../../../src/rules/no-template-enum-member-alias/index.mjs'

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

describe('no-template-enum-member-alias ESLint 规则', () => {
  it('允许 template 直接使用 enum member', () => {
    ruleTester.run('enum-public-api/no-template-enum-member-alias-valid', noTemplateEnumMemberAlias, {
      valid: [
        {
          code: `
            <script setup lang="ts">
            const enum DialogMode {
              Confirm = 'confirm',
            }
            </script>

            <template>
              <CommonDialog :mode="DialogMode.Confirm" />
            </template>
          `,
          filename: 'app/components/common/Dialog/Actions.vue',
          languageOptions: vueLanguageOptions,
        },
        {
          code: `
            <script setup lang="ts">
            const DialogModes = {
              Confirm: 'confirm',
            } as const
            const confirmMode = DialogModes.Confirm
            </script>

            <template>
              <CommonDialog :mode="confirmMode" />
            </template>
          `,
          filename: 'app/components/common/Dialog/Actions.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('提示 template 里的 enum member 一比一中转常量', () => {
    ruleTester.run('enum-public-api/no-template-enum-member-alias-invalid', noTemplateEnumMemberAlias, {
      valid: [],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            const enum DialogMode {
              Alert = 'alert',
              Confirm = 'confirm',
            }
            const alertMode = DialogMode.Alert
            const confirmMode = DialogMode.Confirm
            </script>

            <template>
              <CommonDialog :mode="alertMode" />
              <CommonDialog :mode="confirmMode" />
            </template>
          `,
          filename: 'app/components/common/Dialog/Actions.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'noTemplateEnumMemberAlias',
              data: {
                aliasName: 'alertMode',
                enumMemberText: 'DialogMode.Alert',
              },
            },
            {
              messageId: 'noTemplateEnumMemberAlias',
              data: {
                aliasName: 'confirmMode',
                enumMemberText: 'DialogMode.Confirm',
              },
            },
          ],
        },
      ],
    })
  })
})
