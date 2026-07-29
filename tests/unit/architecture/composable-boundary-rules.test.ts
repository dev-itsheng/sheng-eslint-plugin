import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { afterEach, describe, it } from 'vitest'
import noExtraComposableExports from '../../../src/rules/no-extra-composable-exports/index.mjs'
import noFlatPrivateChildModule from '../../../src/rules/no-flat-private-child-module/index.mjs'
import noGlobalComposableImportUiLayer from '../../../src/rules/no-global-composable-import-ui-layer/index.mjs'
import noGlobalComposablePassThrough from '../../../src/rules/no-global-composable-pass-through/index.mjs'
import noNestedVueContextComposable from '../../../src/rules/no-nested-vue-context-composable/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()
const tempRoots: string[] = []

function createRuleFixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'composable-boundary-rule-'))
  tempRoots.push(root)

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = join(root, relativePath)
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, content)
  }

  return root
}

describe('composable 边界 ESLint 规则', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it('禁止 use*.ts composable 额外导出类型、枚举或常量', () => {
    ruleTester.run('composable-boundary/no-extra-composable-exports', noExtraComposableExports, {
      valid: [
        {
          code: 'export default function useFeatureState() { return {} }',
          filename: '/repo/app/components/catalog/FeatureCard/composables/useFeatureState.ts',
        },
        {
          code: 'export interface Params { id: string }',
          filename: '/repo/app/components/catalog/FeatureCard/composables/types.ts',
          languageOptions: { parser: tsParser },
        },
      ],
      invalid: [
        {
          code: 'export type FeatureContext = { ok: boolean }; export default function useFeatureState() { return {} }',
          filename: '/repo/app/components/catalog/FeatureCard/composables/useFeatureState.ts',
          languageOptions: { parser: tsParser },
          errors: [{ messageId: 'noNamedExport' }],
        },
        {
          code: 'export * from "./types"',
          filename: '/repo/app/components/catalog/FeatureCard/composables/useFeatureState.ts',
          errors: [{ messageId: 'noExportAll' }],
        },
      ],
    })
  })

  it('提醒单一父调用方的私有 composable 或组件不要和父模块平铺', () => {
    const flatRoot = createRuleFixture({
      'app/components/catalog/FeatureCard/composables/useFeatureState.ts': "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
      'app/components/catalog/FeatureCard/composables/useFeatureColumns.ts': 'export default function useFeatureColumns() {}',
    })
    const nestedRoot = createRuleFixture({
      'app/components/catalog/FeatureCard/composables/useFeatureState/index.ts': "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
      'app/components/catalog/FeatureCard/composables/useFeatureState/useFeatureColumns.ts': 'export default function useFeatureColumns() {}',
    })
    const sharedRoot = createRuleFixture({
      'app/components/catalog/FeatureCard/composables/useFeatureState.ts': "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
      'app/components/catalog/FeatureCard/composables/useAnotherFeatureState.ts': "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
      'app/components/catalog/FeatureCard/composables/useFeatureColumns.ts': 'export default function useFeatureColumns() {}',
    })
    const flatVueRoot = createRuleFixture({
      'app/components/catalog/FeatureCard/FeaturePanel.vue': '<template><FeatureActions /></template>',
      'app/components/catalog/FeatureCard/FeatureActions.vue': '<template><div /></template>',
    })

    ruleTester.run('composable-boundary/no-flat-private-child-module', noFlatPrivateChildModule, {
      valid: [
        {
          code: "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
          filename: join(nestedRoot, 'app/components/catalog/FeatureCard/composables/useFeatureState/index.ts'),
          languageOptions: { parser: tsParser },
        },
        {
          code: "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
          filename: join(sharedRoot, 'app/components/catalog/FeatureCard/composables/useFeatureState.ts'),
          languageOptions: { parser: tsParser },
        },
      ],
      invalid: [
        {
          code: "import useFeatureColumns from './useFeatureColumns'\nuseFeatureColumns()",
          filename: join(flatRoot, 'app/components/catalog/FeatureCard/composables/useFeatureState.ts'),
          languageOptions: { parser: tsParser },
          errors: [{ messageId: 'flatPrivateChild', data: { childName: 'useFeatureColumns.ts', parentName: 'useFeatureState.ts' } }],
        },
        {
          code: '<template><FeatureActions /></template>',
          filename: join(flatVueRoot, 'app/components/catalog/FeatureCard/FeaturePanel.vue'),
          languageOptions: { parser: vueParser },
          errors: [{ messageId: 'flatPrivateChild', data: { childName: 'FeatureActions.vue', parentName: 'FeaturePanel.vue' } }],
        },
      ],
    })
  })

  it('禁止全局 composable 反向依赖 UI 层', () => {
    ruleTester.run('composable-boundary/no-global-composable-import-ui-layer', noGlobalComposableImportUiLayer, {
      valid: [
        {
          code: "import { clearFeedCache } from '~/composables/useFeedCache'",
          filename: 'app/composables/useAuthActions.ts',
        },
        {
          code: "import { formatTitle } from '~/utils/formatTitle'",
          filename: 'app/composables/useCatalogState/index.ts',
        },
        {
          code: "import FeaturePanel from '~/components/catalog/FeaturePanel.vue'",
          filename: 'app/pages/catalog/composables/useCatalogPage.ts',
        },
      ],
      invalid: [
        {
          code: "import { clearFeedCache } from '~/components/feed/FeedSection/composables/useFeedCache'",
          filename: 'app/composables/useAuthActions.ts',
          errors: [{ messageId: 'noGlobalComposableImportUiLayer', data: { globalComposableRoot: 'app/composables', uiLayer: 'app/components' } }],
        },
        {
          code: "export { buildCatalogPage } from '~/pages/catalog/composables/buildCatalogPage'",
          filename: 'app/composables/useCatalogPageFacade.ts',
          errors: [{ messageId: 'noGlobalComposableImportUiLayer', data: { globalComposableRoot: 'app/composables', uiLayer: 'app/pages' } }],
        },
      ],
    })
  })

  it('提醒组件不要把全局 composable 返回值原样转手传给局部 composable', () => {
    ruleTester.run('composable-boundary/no-global-composable-pass-through', noGlobalComposablePassThrough, {
      valid: [
        {
          code: `
            import { useCardGridVirtualRows } from './composables'

            const { items } = toRefs(props)
            useCardGridVirtualRows({ items })
          `,
          filename: '/repo/app/components/feed/CardGrid/index.ts',
          languageOptions: { parser: tsParser },
        },
        {
          code: `
            import { useAccountHeaderState } from './useAccountHeaderState'

            const { accountUid, basicInfo } = useCurrentAccountSources()
            useAccountHeaderState({ accountUid, basicInfo })
          `,
          filename: '/repo/app/components/common/PageHeader/composables/useAccountHeader/index.ts',
          languageOptions: { parser: tsParser },
        },
      ],
      invalid: [
        {
          code: `
            import { useCardGridVirtualRows } from './composables'

            const { isPad, isPC } = useBreakpoints()
            useCardGridVirtualRows({ isPad, isPC })
          `,
          filename: '/repo/app/components/feed/CardGrid/index.ts',
          languageOptions: { parser: tsParser },
          errors: [
            { messageId: 'noGlobalComposablePassThrough', data: { sourceComposable: 'useBreakpoints', name: 'isPad', targetComposable: 'useCardGridVirtualRows' } },
            { messageId: 'noGlobalComposablePassThrough', data: { sourceComposable: 'useBreakpoints', name: 'isPC', targetComposable: 'useCardGridVirtualRows' } },
          ],
        },
        {
          code: `
            import { useRouteState } from './composables'

            const route = useRoute()
            useRouteState({ route, routePath: route.path })
          `,
          filename: '/repo/app/pages/catalog/index.ts',
          languageOptions: { parser: tsParser },
          errors: [
            { messageId: 'noGlobalComposablePassThrough', data: { sourceComposable: 'useRoute', name: 'route', targetComposable: 'useRouteState' } },
            { messageId: 'noGlobalComposablePassThrough', data: { sourceComposable: 'useRoute', name: 'route.path', targetComposable: 'useRouteState' } },
          ],
        },
      ],
    })
  })

  it('限制依赖 Vue/Nuxt 上下文的 API 只能在主边界顶层同步调用', () => {
    ruleTester.run('composable-boundary/no-nested-vue-context-composable', noNestedVueContextComposable, {
      valid: [
        {
          code: `
            export default function useFeatureNavigation() {
              const router = useRouter()
              function openFeature(id: string) {
                router.push('/feature/' + id)
              }
            }
          `,
          filename: '/repo/app/components/catalog/FeatureCard/composables/useFeatureNavigation.ts',
          languageOptions: { parser: tsParser },
        },
        {
          code: `
            <script setup lang="ts">
            const route = useRoute()
            </script>
          `,
          filename: '/repo/app/components/catalog/FeatureCard/index.vue',
          languageOptions: {
            parser: vueParser,
            parserOptions: { parser: tsParser },
          },
        },
      ],
      invalid: [
        {
          code: `
            export default function useFeatureNavigation() {
              function openFeature(id: string) {
                const router = useRouter()
                router.push('/feature/' + id)
              }
            }
          `,
          filename: '/repo/app/components/catalog/FeatureCard/composables/useFeatureNavigation.ts',
          languageOptions: { parser: tsParser },
          errors: [{ messageId: 'nestedContextComposable', data: { name: 'useRouter' } }],
        },
        {
          code: `
            export default async function useFeatureNavigation() {
              await Promise.resolve()
              const route = useRoute()
              return { route }
            }
          `,
          filename: '/repo/app/components/catalog/FeatureCard/composables/useFeatureNavigation.ts',
          languageOptions: { parser: tsParser },
          errors: [{ messageId: 'afterAwait', data: { name: 'useRoute' } }],
        },
        {
          code: `
            export default function useMagicFeature() {
              function run() {
                useMagicContext()
              }
            }
          `,
          filename: '/repo/app/components/common/Magic/composables/useMagicFeature.ts',
          options: [{ names: ['useMagicContext'] }],
          languageOptions: { parser: tsParser },
          errors: [{ messageId: 'nestedContextComposable', data: { name: 'useMagicContext' } }],
        },
      ],
    })
  })
})
