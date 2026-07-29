import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const blogRoot = path.resolve(packageRoot, '../sheng-blog')

const ruleSources = [
  'source/files/2026-05-23 - Vue script setup 中 defineProps 的编译边界与错误排查/kits/define-props-macro-guardrail/copy/eslint/rules/no-nested-define-props',
  'source/files/2026-05-26 - Vue script setup 中组件静默消失的原因：一次命名冲突排查/kits/script-setup-component-name-guardrail/copy/eslint/rules/no-component-name-conflict',
  'source/files/2026-07-03 - 别再用 length 统计用户文本：一次 Unicode 字符数和 ESLint 护栏复盘/kits/unicode-user-text-guardrail/copy/eslint/rules/no-native-string-user-text-ops',
  'source/files/2026-07-09 - Nuxt 自动导入不该靠自觉：一次组件和 Vue API import 的 ESLint 护栏/kits/nuxt-auto-import-guardrail/copy/eslint/rules/no-explicit-vue-api-import',
  'source/files/2026-07-09 - Nuxt 自动导入不该靠自觉：一次组件和 Vue API import 的 ESLint 护栏/kits/nuxt-auto-import-guardrail/copy/eslint/rules/no-explicit-vue-component-import',
  'source/files/2026-07-14 - 用 const enum 和字符串值类型保留公开 API 的自然写法/kits/enum-public-api-guardrail/copy/eslint/rules/no-enum-prop-type',
  'source/files/2026-07-14 - 用 const enum 和字符串值类型保留公开 API 的自然写法/kits/enum-public-api-guardrail/copy/eslint/rules/no-template-enum-member-alias',
  'source/files/2026-07-16 - 别等 review 才想起 SSR：给 Nuxt 模块级 composable 补上静态护栏/kits/nuxt-client-only-source-guardrail/copy/eslint/rules/no-ssr-unsafe-module-state',
  'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail/copy/eslint/rules/no-extra-composable-exports',
  'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail/copy/eslint/rules/no-flat-private-child-module',
  'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail/copy/eslint/rules/no-global-composable-import-ui-layer',
  'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail/copy/eslint/rules/no-global-composable-pass-through',
  'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail/copy/eslint/rules/no-nested-vue-context-composable',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-chinese-user-text-literal',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-dom-query-in-component',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-dynamic-i18n-t-key',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-i18n-t-fallback',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-missing-static-asset-import',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-redundant-indexed-record-satisfies',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-redundant-watch-source-compare',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-static-px-inline-style',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/no-type-import-used-as-value',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/prefer-inline-single-use-map',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/prefer-inline-trivial-computed',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/prefer-keyed-object-map',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/prefer-to-refs-props',
  'source/files/2026-07-24 - 把无限滚动触底触发器抽成 composable：虚拟列表、哨兵和滚动兜底/kits/load-more-trigger-guardrail/copy/eslint/rules/prefer-load-more-trigger',
]

const utilitySources = [
  {
    from: 'source/files/2026-07-09 - Nuxt 自动导入不该靠自觉：一次组件和 Vue API import 的 ESLint 护栏/kits/nuxt-auto-import-guardrail/copy/eslint/rules/utils/nuxt-component-name.mjs',
    to: 'nuxt-component-name.mjs',
  },
  {
    from: 'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/eslint/rules/utils/i18n-call.mjs',
    to: 'i18n-call.mjs',
  },
]

const testSourceDirectories = [
  'source/files/2026-05-23 - Vue script setup 中 defineProps 的编译边界与错误排查/kits/define-props-macro-guardrail/copy/tests/unit/architecture',
  'source/files/2026-05-26 - Vue script setup 中组件静默消失的原因：一次命名冲突排查/kits/script-setup-component-name-guardrail/copy/tests/unit/architecture',
  'source/files/2026-07-03 - 别再用 length 统计用户文本：一次 Unicode 字符数和 ESLint 护栏复盘/kits/unicode-user-text-guardrail/copy/tests/unit/architecture',
  'source/files/2026-07-09 - Nuxt 自动导入不该靠自觉：一次组件和 Vue API import 的 ESLint 护栏/kits/nuxt-auto-import-guardrail/copy/tests/unit/architecture',
  'source/files/2026-07-14 - 用 const enum 和字符串值类型保留公开 API 的自然写法/kits/enum-public-api-guardrail/copy/tests/unit/architecture',
  'source/files/2026-07-16 - 别等 review 才想起 SSR：给 Nuxt 模块级 composable 补上静态护栏/kits/nuxt-client-only-source-guardrail/copy/tests/unit/architecture',
  'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail/copy/tests/unit/architecture',
  'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails/copy/tests/unit/architecture',
  'source/files/2026-07-24 - 把无限滚动触底触发器抽成 composable：虚拟列表、哨兵和滚动兜底/kits/load-more-trigger-guardrail/copy/tests/unit/architecture',
]

async function copyRuleDirectories() {
  const targetRoot = path.join(packageRoot, 'src/rules')
  await mkdir(targetRoot, { recursive: true })

  for (const sourceRelativePath of ruleSources) {
    const sourcePath = path.join(blogRoot, sourceRelativePath)
    const targetPath = path.join(targetRoot, path.basename(sourcePath))
    await rm(targetPath, { force: true, recursive: true })
    await cp(sourcePath, targetPath, { recursive: true })
  }
}

async function copyUtilities() {
  const targetRoot = path.join(packageRoot, 'src/rules/utils')
  await mkdir(targetRoot, { recursive: true })

  for (const utility of utilitySources) {
    await cp(path.join(blogRoot, utility.from), path.join(targetRoot, utility.to))
  }
}

async function copyTests() {
  const targetRoot = path.join(packageRoot, 'tests/unit/architecture')
  await rm(targetRoot, { force: true, recursive: true })
  await mkdir(targetRoot, { recursive: true })

  for (const sourceDirectory of testSourceDirectories) {
    const entries = await import('node:fs/promises').then(fs => fs.readdir(path.join(blogRoot, sourceDirectory), { withFileTypes: true }))
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
      const sourcePath = path.join(blogRoot, sourceDirectory, entry.name)
      const targetPath = path.join(targetRoot, entry.name)
      await cp(sourcePath, targetPath)
      const content = await readFile(targetPath, 'utf8')
      await writeFile(targetPath, content.replaceAll('../../../eslint/rules/', '../../../src/rules/'))
    }
  }
}

await copyRuleDirectories()
await copyUtilities()
await copyTests()

console.log(`Copied ${ruleSources.length} rules into ${path.relative(process.cwd(), path.join(packageRoot, 'src/rules'))}.`)
