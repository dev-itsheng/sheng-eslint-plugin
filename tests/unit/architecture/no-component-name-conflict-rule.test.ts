import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noComponentNameConflict from '../../../src/rules/no-component-name-conflict/index.mjs'

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

describe('no-component-name-conflict ESLint 规则', () => {
  it('允许状态变量改成更具体的业务名', () => {
    ruleTester.run('vue-script-setup/no-component-name-conflict-valid-feedback-name', noComponentNameConflict, {
      valid: [
        {
          code: `
            <template>
              <popup-status :message="popupFeedback.message" :type="popupFeedback.type" />
            </template>

            <script setup lang="ts">
            import { PopupStatus } from './components'

            const popupFeedback = {
              message: 'Saved',
              type: 'success',
            }
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('允许模板直接使用 PascalCase 组件名', () => {
    ruleTester.run('vue-script-setup/no-component-name-conflict-valid-pascal-tag', noComponentNameConflict, {
      valid: [
        {
          code: `
            <template>
              <PopupStatus :message="popupStatus.message" :type="popupStatus.type" />
            </template>

            <script setup lang="ts">
            import { PopupStatus } from './components'

            const popupStatus = {
              message: 'Saved',
              type: 'success',
            }
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('跳过非 script setup、type-only import 和原生标签', () => {
    ruleTester.run('vue-script-setup/no-component-name-conflict-valid-boundaries', noComponentNameConflict, {
      valid: [
        {
          code: `
            <template>
              <popup-status :message="popupStatus.message" />
            </template>

            <script lang="ts">
            import { PopupStatus } from './components'
            export default {
              setup() {
                const popupStatus = { message: 'Saved' }
                return { popupStatus, PopupStatus }
              },
            }
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
        },
        {
          code: `
            <template>
              <popup-status :message="popupStatus.message" />
            </template>

            <script setup lang="ts">
            import type { PopupStatus } from './types'

            const popupStatus = {
              message: 'Saved',
            }
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
        },
        {
          code: `
            <template>
              <main>{{ main.title }}</main>
            </template>

            <script setup lang="ts">
            import { Main } from './components'

            const main = {
              title: 'Home',
            }
            </script>
          `,
          filename: 'src/components/HomePage.vue',
          languageOptions: vueLanguageOptions,
        },
        {
          code: `
            <template>
              <user-card @save-user="saveUser" />
            </template>

            <script setup lang="ts">
            import { UserCard } from './components'
            import { SaveUser } from './events'

            const saveUser = () => {}
            </script>
          `,
          filename: 'src/components/UserPage.vue',
          languageOptions: vueLanguageOptions,
        },
        {
          code: `
            <template>
              <input v-focus />
            </template>

            <script setup lang="ts">
            const vFocus = {
              mounted() {},
            }
            </script>
          `,
          filename: 'src/components/InputPage.vue',
          languageOptions: vueLanguageOptions,
        },
        {
          code: `
            <template>
              <input v-show="visible" />
            </template>

            <script setup lang="ts">
            const vShow = {}
            const VShow = {}
            const visible = true
            </script>
          `,
          filename: 'src/components/InputPage.vue',
          languageOptions: vueLanguageOptions,
        },
      ],
      invalid: [],
    })
  })

  it('提示 kebab-case 组件 tag 命中同名普通绑定', () => {
    ruleTester.run('vue-script-setup/no-component-name-conflict-invalid-kebab-tag', noComponentNameConflict, {
      valid: [],
      invalid: [
        {
          code: `
            <template>
              <popup-status :message="popupStatus.message" :type="popupStatus.type" />
            </template>

            <script setup lang="ts">
            import { PopupStatus } from './components'

            const popupStatus = {
              message: 'Saved',
              type: 'success',
            }
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'componentNameConflict',
              data: {
                componentName: 'PopupStatus',
                localName: 'popupStatus',
                tagName: 'popup-status',
              },
            },
          ],
        },
      ],
    })
  })

  it('提示解构出来的普通绑定和组件 import 冲突', () => {
    ruleTester.run('vue-script-setup/no-component-name-conflict-invalid-destructure', noComponentNameConflict, {
      valid: [],
      invalid: [
        {
          code: `
            <template>
              <popup-status :message="popupStatus.message" />
            </template>

            <script setup lang="ts">
            import PopupStatus from './PopupStatus.vue'
            import { usePopupFlow } from './usePopupFlow'

            const { popupStatus } = usePopupFlow()
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'componentNameConflict',
              data: {
                componentName: 'PopupStatus',
                localName: 'popupStatus',
                tagName: 'popup-status',
              },
            },
          ],
        },
      ],
    })
  })

  it('提示自定义指令名命中多个 script setup 顶层绑定', () => {
    ruleTester.run('vue-script-setup/no-component-name-conflict-invalid-directive-name', noComponentNameConflict, {
      valid: [],
      invalid: [
        {
          code: `
            <template>
              <input v-popup-status />
            </template>

            <script setup lang="ts">
            import { VPopupStatus } from './directives'

            const vPopupStatus = {
              mounted() {},
            }
            </script>
          `,
          filename: 'src/components/PopupPage.vue',
          languageOptions: vueLanguageOptions,
          errors: [
            {
              messageId: 'directiveNameConflict',
              data: {
                bindingNames: '"vPopupStatus", "VPopupStatus"',
                directiveName: 'v-popup-status',
              },
            },
          ],
        },
      ],
    })
  })
})
