import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, expect, it } from 'vitest'
import noExplicitVueApiImport from '../../../src/rules/no-explicit-vue-api-import/index.mjs'
import noExplicitVueComponentImport from '../../../src/rules/no-explicit-vue-component-import/index.mjs'
import { createRuleContextCompat } from '../../../src/rules/utils/eslint-rule-context.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('ESLint RuleContext 兼容层', () => {
  it('兼容 ESLint 8/9 和 10 的 filename / cwd API', () => {
    const sourceCode = {}
    const report = () => {}

    const eslint8Or9Context = createRuleContextCompat(
      {
        filename: '/repo/app/components/ProfileCard.vue',
        cwd: '/repo',
        sourceCode,
        options: [],
        report,
        getFilename: () => '/repo/legacy/ProfileCard.vue',
        getCwd: () => '/legacy',
      },
      'nuxt-auto-import/test-rule',
    )

    expect(eslint8Or9Context.filename).toBe('/repo/app/components/ProfileCard.vue')
    expect(eslint8Or9Context.cwd).toBe('/repo')
    expect(eslint8Or9Context.eslintRuleApiFamily).toBe('eslint-8-or-9')

    const eslint10Context = createRuleContextCompat(
      {
        filename: '/repo/app/pages/home.vue',
        cwd: '/repo',
        sourceCode,
        options: [],
        report,
      },
      'nuxt-auto-import/test-rule',
    )

    expect(eslint10Context.filename).toBe('/repo/app/pages/home.vue')
    expect(eslint10Context.cwd).toBe('/repo')
    expect(eslint10Context.eslintRuleApiFamily).toBe('eslint-10-or-newer')
  })
})

describe('no-explicit-vue-component-import ESLint 规则', () => {
  it('提示 app/components 里的相对路径 Vue 组件 import，建议改用 Nuxt 自动导入名', () => {
    ruleTester.run('nuxt-auto-import/no-explicit-vue-component-import', noExplicitVueComponentImport, {
      valid: [
        {
          code: "import helper from './helper'",
          filename: 'app/components/common/ProfileCard/index.vue',
        },
        {
          code: "import helper from '~/utils/helper'",
          filename: 'app/components/common/ProfileCard/index.vue',
        },
        {
          code: "import InnerItem from './InnerItem.vue'",
          filename: 'app/components/legacy/LegacyPanel/index.vue',
          options: [{ ignoredPathPatterns: ['^app/components/legacy/'] }],
        },
      ],
      invalid: [
        {
          code: "import Avatar from './Avatar/index.vue'",
          filename: 'app/components/common/User/Profile/Card/index.vue',
          errors: [
            {
              messageId: 'componentRelativeImport',
              data: {
                componentName: 'CommonUserProfileCardAvatar',
              },
            },
          ],
        },
        {
          code: "import RecordRow from './RecordRow.vue'",
          filename: 'app/components/common/User/Profile/Record/index.vue',
          errors: [
            {
              messageId: 'componentRelativeImport',
              data: {
                componentName: 'CommonUserProfileRecordRow',
              },
            },
          ],
        },
        {
          code: "import CommonEmptyState from '~/components/common/EmptyState/index.vue'",
          filename: 'app/components/dashboard/Report/EmptyState/index.vue',
          errors: [
            {
              messageId: 'componentAliasImport',
              data: {
                componentName: 'CommonEmptyState',
              },
            },
          ],
        },
      ],
    })
  })

  it('提示 app/pages 里显式 import app/components 组件', () => {
    ruleTester.run('nuxt-auto-import/no-explicit-vue-component-import-pages', noExplicitVueComponentImport, {
      valid: [
        {
          code: "import LocalPanel from './components/LocalPanel.vue'",
          filename: 'app/pages/me/index.vue',
        },
      ],
      invalid: [
        {
          code: "import FeedSection from '~/components/home/FeedSection/index.vue'",
          filename: 'app/pages/home/index.vue',
          errors: [
            {
              messageId: 'pageComponentImport',
              data: {
                componentName: 'HomeFeedSection',
              },
            },
          ],
        },
      ],
    })
  })
})

describe('no-explicit-vue-api-import ESLint 规则', () => {
  it('提示 Nuxt 已自动导入的 Vue 运行时 API，同时放过类型 import', () => {
    ruleTester.run('nuxt-auto-import/no-explicit-vue-api-import', noExplicitVueApiImport, {
      valid: [
        "import { h } from 'vue'",
        {
          code: "import { computed } from 'vue'",
          filename: 'app/components/legacy/LegacyItem.vue',
          options: [{ ignoredPathPatterns: ['^app/components/legacy/'] }],
        },
      ],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            import { computed, ref } from 'vue'
            </script>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [
            { messageId: 'noExplicitVueApiImport', data: { name: 'computed' } },
            { messageId: 'noExplicitVueApiImport', data: { name: 'ref' } },
          ],
        },
        {
          code: `
            <script setup lang="ts">
            import { toRefs } from 'vue'
            const { user } = toRefs(props)
            </script>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noExplicitVueApiImport', data: { name: 'toRefs' } }],
        },
      ],
    })
  })
})
