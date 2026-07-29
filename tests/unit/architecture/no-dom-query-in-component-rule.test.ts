import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noDomQueryInComponent from '../../../src/rules/no-dom-query-in-component/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-dom-query-in-component ESLint 规则', () => {
  it('提示组件和页面里的 DOM 查找，推动使用 template ref / function ref', () => {
    ruleTester.run('project-style/no-dom-query-in-component', noDomQueryInComponent, {
      valid: [
        {
          code: 'const activeNode = activeNodeRef.value',
          filename: 'app/components/common/ProfileCard/index.vue',
        },
        {
          code: 'const matches = element.matches(".active")',
          filename: 'app/components/common/ProfileCard/index.vue',
        },
        {
          code: 'const button = document.getElementById("third_party_widget_button")',
          filename: 'app/components/common/vendor/thirdPartyWidget/launchThirdPartyWidget.ts',
          options: [{ ignoredPathPatterns: ['^app/components/common/vendor/thirdPartyWidget/'] }],
        },
      ],
      invalid: [
        {
          code: 'const activeNode = root.value?.querySelector("[data-active]")',
          filename: 'app/components/common/ProfileCard/index.vue',
          errors: [{ messageId: 'noDomQuery', data: { name: 'querySelector' } }],
        },
        {
          code: 'const nodes = document.querySelectorAll(".profile-card")',
          filename: 'app/pages/profile/[uid]/index.vue',
          errors: [{ messageId: 'noDomQuery', data: { name: 'querySelectorAll' } }],
        },
        {
          code: 'const dialog = document.getElementById("dialog")',
          filename: 'app/components/common/Dialog/index.vue',
          errors: [{ messageId: 'noDomQuery', data: { name: 'getElementById' } }],
        },
        {
          code: 'const items = document["getElementsByClassName"]("item")',
          filename: 'app/components/common/Dialog/index.vue',
          errors: [{ messageId: 'noDomQuery', data: { name: 'getElementsByClassName' } }],
        },
      ],
    })
  })

  it('覆盖 Vue SFC script setup 里的 DOM 查找', () => {
    ruleTester.run('project-style/no-dom-query-in-component-vue', noDomQueryInComponent, {
      invalid: [
        {
          code: `
            <script setup lang="ts">
            const timelineItem = timelineScrollerRef.value?.querySelector('[data-index="1"]')
            </script>
          `,
          filename: 'app/components/common/TimelinePreview/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'noDomQuery', data: { name: 'querySelector' } }],
        },
      ],
      valid: [
        {
          code: `
            <script setup lang="ts">
            const timelineNodeRefs = shallowRef({})
            function setTimelineNodeRef(value, index) {
              timelineNodeRefs.value = { ...timelineNodeRefs.value, [index]: value }
            }
            </script>
          `,
          filename: 'app/components/common/TimelinePreview/index.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
    })
  })
})
