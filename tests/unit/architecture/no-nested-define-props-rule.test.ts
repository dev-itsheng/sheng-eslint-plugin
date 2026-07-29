import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noNestedDefineProps from '../../../src/rules/no-nested-define-props/index.mjs'

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

describe('no-nested-define-props ESLint 规则', () => {
  it('允许 defineProps 作为顶层变量初始化入口', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-valid-top-level-init', noNestedDefineProps, {
      valid: [
        {
          code: `
            <script setup lang="ts">
            import { toRefs } from 'vue'

            interface Props {
              level: number
            }

            const props = defineProps<Props>()
            const { level } = toRefs(props)
            </script>
          `,
          filename: 'src/components/PrivilegeEntry.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('允许直接从 defineProps 解构', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-valid-direct-destructure', noNestedDefineProps, {
      valid: [
        {
          code: `
            <script setup lang="ts">
            interface Props {
              title: string
            }

            const { title } = defineProps<Props>()
            </script>
          `,
          filename: 'src/components/TitleBlock.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('允许 withDefaults 包住 defineProps', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-valid-with-defaults', noNestedDefineProps, {
      valid: [
        {
          code: `
            <script setup lang="ts">
            interface Props {
              title?: string
              labels?: string[]
            }

            const props = withDefaults(defineProps<Props>(), {
              title: 'Untitled',
              labels: () => [],
            })
            </script>
          `,
          filename: 'src/components/TitleBlock.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('跳过非 script setup 文件', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-valid-non-script-setup', noNestedDefineProps, {
      valid: [
        {
          code: `
            <script lang="ts">
            import { defineComponent, toRefs } from 'vue'

            export default defineComponent({
              setup(props) {
                const { level } = toRefs(props)
                return { level }
              },
            })
            </script>
          `,
          filename: 'src/components/PrivilegeEntry.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('提示 toRefs 直接包住 defineProps', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-invalid-to-refs', noNestedDefineProps, {
      valid: [],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            import { toRefs } from 'vue'

            interface Props {
              level: number
            }

            const { level } = toRefs(defineProps<Props>())
            </script>
          `,
          filename: 'src/components/PrivilegeEntry.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'nestedDefineProps',
              data: {
                wrapper: 'toRefs(...)',
              },
            },
          ],
        },
      ],
    })
  })

  it('提示 toRef、readonly 和自定义函数直接包住 defineProps', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-invalid-runtime-wrappers', noNestedDefineProps, {
      valid: [],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            import { readonly, toRef } from 'vue'

            interface Props {
              level: number
            }

            const level = toRef(defineProps<Props>(), 'level')
            const readonlyProps = readonly(defineProps<Props>())
            const normalizedProps = customNormalizeProps(defineProps<Props>())
            </script>
          `,
          filename: 'src/components/PrivilegeEntry.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'nestedDefineProps',
              data: {
                wrapper: 'toRef(...)',
              },
            },
            {
              messageId: 'nestedDefineProps',
              data: {
                wrapper: 'readonly(...)',
              },
            },
            {
              messageId: 'nestedDefineProps',
              data: {
                wrapper: 'customNormalizeProps(...)',
              },
            },
          ],
        },
      ],
    })
  })

  it('提示 defineProps 藏在条件表达式里', () => {
    ruleTester.run('vue-script-setup/no-nested-define-props-invalid-conditional', noNestedDefineProps, {
      valid: [],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            interface Props {
              level: number
            }

            const props = import.meta.env.DEV ? defineProps<Props>() : {}
            </script>
          `,
          filename: 'src/components/PrivilegeEntry.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'nestedDefineProps',
              data: {
                wrapper: '条件表达式',
              },
            },
          ],
        },
      ],
    })
  })
})
