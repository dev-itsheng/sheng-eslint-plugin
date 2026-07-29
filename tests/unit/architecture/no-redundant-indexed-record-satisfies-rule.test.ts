import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import noRedundantIndexedRecordSatisfies from '../../../src/rules/no-redundant-indexed-record-satisfies/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

const tsLanguageOptions = {
  parser: tsParser,
}

describe('no-redundant-indexed-record-satisfies ESLint 规则', () => {
  it('提示完整 Record 映射表被立即索引时去掉冗余 satisfies', () => {
    ruleTester.run('project-style/no-redundant-indexed-record-satisfies-invalid', noRedundantIndexedRecordSatisfies, {
      valid: [],
      invalid: [
        {
          code: `
            const activeLoading = (({
              [DashboardTab.Overview]: overviewLoading.value,
              [DashboardTab.Billing]: billingLoading.value,
            }) satisfies Record<DashboardTab, boolean>)[activeTab.value]
          `,
          languageOptions: tsLanguageOptions,
          errors: [{ messageId: 'noRedundantIndexedRecordSatisfies' }],
        },
        {
          code: `
            const tabName = ({
              [DashboardTab.Overview]: 'overview',
              [DashboardTab.Billing]: 'diamond',
            } satisfies Record<DashboardTab, string>)[tab]
          `,
          languageOptions: tsLanguageOptions,
          errors: [{ messageId: 'noRedundantIndexedRecordSatisfies' }],
        },
      ],
    })
  })

  it('保留部分映射、开放 key 映射和非立即索引的 satisfies', () => {
    ruleTester.run('project-style/no-redundant-indexed-record-satisfies-valid', noRedundantIndexedRecordSatisfies, {
      valid: [
        {
          code: `
            const rule = (({
              [TaskType.Message]: chatRule,
              [TaskType.Call]: voiceRule,
            }) satisfies Partial<Record<TaskType, string>>)[taskType]
          `,
          languageOptions: tsLanguageOptions,
        },
        {
          code: `
            const label = ({
              ready: readyLabel,
              error: errorLabel,
            } satisfies Record<string, string>)[status]
          `,
          languageOptions: tsLanguageOptions,
        },
        {
          code: `
            const labelByTab = {
              [DashboardTab.Overview]: commonLabel,
              [DashboardTab.Billing]: diamondLabel,
            } satisfies Record<DashboardTab, string>
            const label = labelByTab[tab]
          `,
          languageOptions: tsLanguageOptions,
        },
        {
          code: `
            const label = {
              [DashboardTab.Overview]: commonLabel,
              [DashboardTab.Billing]: diamondLabel,
            }[tab]
          `,
          languageOptions: tsLanguageOptions,
        },
      ],
      invalid: [],
    })
  })
})
