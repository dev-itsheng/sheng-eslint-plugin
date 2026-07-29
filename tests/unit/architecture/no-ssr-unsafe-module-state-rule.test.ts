import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import noSsrUnsafeModuleState from '../../../src/rules/no-ssr-unsafe-module-state/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-ssr-unsafe-module-state ESLint 规则', () => {
  it('提示 Nuxt use* composable 里的模块级可变状态必须声明 SSR 策略', () => {
    ruleTester.run('project-style/no-ssr-unsafe-module-state', noSsrUnsafeModuleState, {
      valid: [
        {
          filename: 'app/composables/useStickyHeaderBridge/index.ts',
          code: `
            import useClientOnlySourceState from '../useClientOnlySourceState'

            const stickyHeaderBridgeClientSource = useClientOnlySourceState(createStickyHeaderBridgeStore)

            export default function useStickyHeaderBridge() {
              if (import.meta.server) return createServerStickyHeaderBridgeState()
              return stickyHeaderBridgeClientSource.getClientState()
            }
          `,
        },
        {
          filename: 'app/composables/useStickyHeaderBridge.ts',
          code: `
            const STICKY_STATE_HYSTERESIS_PX = 4

            export default function useStickyHeaderBridge() {
              return { stickyThreshold: STICKY_STATE_HYSTERESIS_PX }
            }
          `,
        },
        {
          filename: 'app/utils/createStickyHeaderBridge.ts',
          code: `
            const compactHeaderIsVisible = ref(false)
          `,
        },
        {
          filename: 'app/composables/useDialogQueue/index.ts',
          code: `
            const dialogQueue = ref([])

            export default function useDialogQueue() {
              if (import.meta.server) return createServerDialogQueue()
              return { dialogQueue }
            }
          `,
        },
      ],
      invalid: [
        {
          filename: 'app/composables/useStickyHeaderBridge/index.ts',
          code: `
            const compactHeaderIsVisible = ref(false)
            let frame = 0

            export default function useStickyHeaderBridge() {
              return { compactHeaderIsVisible }
            }
          `,
          errors: [
            {
              messageId: 'missingSsrGuard',
              data: { name: 'compactHeaderIsVisible' },
            },
            {
              messageId: 'missingSsrGuard',
              data: { name: 'frame' },
            },
          ],
        },
        {
          filename: 'app/composables/useStickyHeaderBridge.ts',
          code: `
            const registeredElements = new Map()

            export default function useStickyHeaderBridge() {
              return { registeredElements }
            }
          `,
          errors: [
            {
              messageId: 'missingSsrGuard',
              data: { name: 'registeredElements' },
            },
          ],
        },
      ],
    })
  })
})
