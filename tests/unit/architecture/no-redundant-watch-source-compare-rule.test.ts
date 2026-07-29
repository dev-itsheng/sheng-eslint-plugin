import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noRedundantWatchSourceCompare from '../../../src/rules/no-redundant-watch-source-compare/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-redundant-watch-source-compare ESLint 规则', () => {
  it('禁止单 source watch 回调里冗余比较 next value 和 previous value', () => {
    ruleTester.run('project-style/no-redundant-watch-source-compare', noRedundantWatchSourceCompare, {
      valid: [
        'watch(uid, (nextUid) => { if (!nextUid) return; refresh(nextUid) })',
        "watch(activeTab, (nextTab, previousTab) => { if (nextTab === 'recommend' && previousTab === 'me') refresh() })",
        'watch([uid, locale], ([nextUid], [previousUid]) => { if (nextUid === previousUid) return })',
        'watch(uid, (nextUid, previousUid) => { if (nextUid.id === previousUid.id) return })',
        'watch(profile, (nextProfile, previousProfile) => { if (nextProfile === previousProfile) return }, { deep: true })',
      ],
      invalid: [
        {
          code: 'watch(uid, (nextUid, previousUid) => { if (nextUid === previousUid) return; refresh() })',
          errors: [{ messageId: 'redundantCompare' }],
        },
        {
          code: 'watch(uid, function (nextUid, previousUid) { if (previousUid !== nextUid) refresh() })',
          errors: [{ messageId: 'redundantCompare' }],
        },
        {
          code: 'watch(accountUid, (uid, previousUid) => load(uid !== previousUid))',
          errors: [{ messageId: 'redundantCompare' }],
        },
      ],
    })
  })

  it('覆盖 Vue script setup 里的单 source watch 冗余比较', () => {
    ruleTester.run('project-style/no-redundant-watch-source-compare-vue', noRedundantWatchSourceCompare, {
      valid: [
        {
          code: `
            <script setup lang="ts">
            watch(uid, (nextUid) => {
              if (!nextUid) return
              refresh()
            })
            </script>
          `,
          filename: 'valid.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            watch(uid, (nextUid, previousUid) => {
              if (nextUid === previousUid) return
              refresh()
            })
            </script>
          `,
          filename: 'invalid.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'redundantCompare' }],
        },
      ],
    })
  })
})
