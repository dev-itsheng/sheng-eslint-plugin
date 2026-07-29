import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import preferInlineSingleUseMap from '../../../src/rules/prefer-inline-single-use-map/index.mjs'

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

describe('prefer-inline-single-use-map ESLint 规则', () => {
  it('提示只被索引读取一次的字面量映射表内联', () => {
    ruleTester.run('project-style/prefer-inline-single-use-map-invalid', preferInlineSingleUseMap, {
      valid: [],
      invalid: [
        {
          code: `
            const iconSrcByType = {
              coin: coinSrc,
              diamond: pointsSrc,
            }
            const iconSrc = computed(() => iconSrcByType[type.value])
          `,
          errors: [{ messageId: 'preferInlineSingleUseMap' }],
        },
        {
          code: `
            const iconSrcByType = {
              coin: coinSrc,
              diamond: pointsSrc,
            } satisfies Record<'coin' | 'diamond', string>
            const iconSrc = computed(() => iconSrcByType[type.value])
          `,
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'preferInlineSingleUseMap' }],
        },
        {
          code: `
            const podiumFrames = [top1FrameSrc, top2FrameSrc, top3FrameSrc]
            const currentFrame = podiumFrames[rank - 1]
          `,
          errors: [{ messageId: 'preferInlineSingleUseMap' }],
        },
        {
          code: `
            const messageByAction = {
              block: blockMessage,
              unblock: unblockMessage,
            } as const
            return (messageByAction as Record<string, string>)[action]
          `,
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'preferInlineSingleUseMap' }],
        },
      ],
    })
  })

  it('保留有真实复用、非索引用途或 template 读取的映射表', () => {
    ruleTester.run('project-style/prefer-inline-single-use-map-valid', preferInlineSingleUseMap, {
      valid: [
        `
          const iconSrcByType = {
            coin: coinSrc,
            diamond: pointsSrc,
          }
          const headerIconSrc = computed(() => iconSrcByType[headerType.value])
          const footerIconSrc = computed(() => iconSrcByType[footerType.value])
        `,
        `
          const nextMap = { ...remarksByUid.value }
          nextMap[uid] = remark
          remarksByUid.value = nextMap
        `,
        `
          const payload = {
            uid,
            remark,
          }
          await updateRemark(payload)
        `,
        `
          export const iconSrcByType = {
            coin: coinSrc,
            diamond: pointsSrc,
          }
          const iconSrc = computed(() => iconSrcByType[type.value])
        `,
        {
          code: `
            <script setup lang="ts">
            const iconSrcByType = {
              coin: coinSrc,
              diamond: pointsSrc,
            }
            </script>

            <template>
              <img :src="iconSrcByType[type]" />
            </template>
          `,
          filename: 'app/components/common/InlineMapTemplateProbe.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })
})
