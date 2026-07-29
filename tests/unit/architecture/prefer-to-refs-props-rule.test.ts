import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import preferToRefsProps from '../../../src/rules/prefer-to-refs-props/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('prefer-to-refs-props ESLint 规则', () => {
  it('提醒组件脚本统一用 toRefs(props)，不再混用 props.xxx 或 toRef(props, key)', () => {
    ruleTester.run('project-style/prefer-to-refs-props', preferToRefsProps, {
      valid: [
        {
          code: 'const props = defineProps<{ name: string }>(); const { name } = toRefs(props); console.log(name.value)',
          filename: '/repo/app/components/common/GalleryPanel/index.vue',
          languageOptions: {
            parser: tsParser,
          },
        },
        {
          code: 'const otherProps = { name: "Demo" }; console.log(otherProps.name); const name = toRef(otherProps, "name")',
          filename: '/repo/app/components/common/GalleryPanel/index.vue',
        },
      ],
      invalid: [
        {
          code: 'const props = defineProps<{ name: string }>(); console.log(props.name)',
          filename: '/repo/app/components/common/GalleryPanel/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'noPropsMember' }],
        },
        {
          code: 'const props = defineProps<{ name: string }>(); const name = toRef(props, "name")',
          filename: '/repo/app/components/common/GalleryPanel/index.vue',
          languageOptions: {
            parser: tsParser,
          },
          errors: [{ messageId: 'noToRefProps' }],
        },
      ],
    })
  })
})
