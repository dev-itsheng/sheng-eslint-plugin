import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ruleGroups } from '../src/rules/index.js'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const blogRoot = path.resolve(packageRoot, '../sheng-blog')
const namespace = '@sheng'

interface KitMapping {
  configName: keyof typeof ruleGroups
  kitPath: string
  oldNamespaces: string[]
  ruleNames: string[]
  testFiles: string[]
  utilities: string[]
}

const kitMappings: KitMapping[] = [
  {
    configName: 'vue-script-setup',
    kitPath: 'source/files/2026-05-23 - Vue script setup 中 defineProps 的编译边界与错误排查/kits/define-props-macro-guardrail',
    oldNamespaces: ['vue-script-setup'],
    ruleNames: ['no-nested-define-props'],
    testFiles: ['no-nested-define-props-rule.test.ts'],
    utilities: [],
  },
  {
    configName: 'vue-script-setup',
    kitPath: 'source/files/2026-05-26 - Vue script setup 中组件静默消失的原因：一次命名冲突排查/kits/script-setup-component-name-guardrail',
    oldNamespaces: ['vue-script-setup'],
    ruleNames: ['no-component-name-conflict'],
    testFiles: ['no-component-name-conflict-rule.test.ts'],
    utilities: [],
  },
  {
    configName: 'unicode-user-text',
    kitPath: 'source/files/2026-07-03 - 别再用 length 统计用户文本：一次 Unicode 字符数和 ESLint 护栏复盘/kits/unicode-user-text-guardrail',
    oldNamespaces: ['user-text', 'unicode-user-text'],
    ruleNames: ['no-native-string-user-text-ops'],
    testFiles: ['no-native-string-user-text-ops-rule.test.ts'],
    utilities: ['eslint-rule-context.mjs'],
  },
  {
    configName: 'nuxt-auto-import',
    kitPath: 'source/files/2026-07-09 - Nuxt 自动导入不该靠自觉：一次组件和 Vue API import 的 ESLint 护栏/kits/nuxt-auto-import-guardrail',
    oldNamespaces: ['nuxt-auto-import'],
    ruleNames: ['no-explicit-vue-api-import', 'no-explicit-vue-component-import'],
    testFiles: ['no-explicit-vue-auto-import-rule.test.ts', 'nuxt-auto-import-component-usage.test.ts'],
    utilities: ['eslint-rule-context.mjs', 'nuxt-component-name.mjs'],
  },
  {
    configName: 'enum-public-api',
    kitPath: 'source/files/2026-07-14 - 用 const enum 和字符串值类型保留公开 API 的自然写法/kits/enum-public-api-guardrail',
    oldNamespaces: ['enum-public-api'],
    ruleNames: ['no-enum-prop-type', 'no-template-enum-member-alias'],
    testFiles: ['enum-member-alias-boundary.test.ts', 'no-enum-prop-type-rule.test.ts', 'no-template-enum-member-alias-rule.test.ts'],
    utilities: [],
  },
  {
    configName: 'nuxt-client-only-source',
    kitPath: 'source/files/2026-07-16 - 别等 review 才想起 SSR：给 Nuxt 模块级 composable 补上静态护栏/kits/nuxt-client-only-source-guardrail',
    oldNamespaces: ['project-style'],
    ruleNames: ['no-ssr-unsafe-module-state'],
    testFiles: ['no-ssr-unsafe-module-state-rule.test.ts'],
    utilities: ['eslint-rule-context.mjs'],
  },
  {
    configName: 'composable-boundary',
    kitPath: 'source/files/2026-07-24 - Composable 的公开面别靠默契：用 ESLint 守住私有模块边界/kits/composable-boundary-guardrail',
    oldNamespaces: ['composable-boundary'],
    ruleNames: ['no-extra-composable-exports', 'no-flat-private-child-module', 'no-global-composable-import-ui-layer', 'no-global-composable-pass-through', 'no-nested-vue-context-composable'],
    testFiles: ['composable-boundary-rules.test.ts'],
    utilities: ['eslint-rule-context.mjs'],
  },
  {
    configName: 'project-style',
    kitPath: 'source/files/2026-07-24 - Skill 管不住代码风格时：把项目约定写成 ESLint 护栏/kits/agent-code-style-eslint-guardrails',
    oldNamespaces: ['project-style'],
    ruleNames: [
      'no-chinese-user-text-literal',
      'no-dom-query-in-component',
      'no-dynamic-i18n-t-key',
      'no-i18n-t-fallback',
      'no-missing-static-asset-import',
      'no-redundant-indexed-record-satisfies',
      'no-redundant-watch-source-compare',
      'no-static-px-inline-style',
      'no-type-import-used-as-value',
      'prefer-inline-single-use-map',
      'prefer-inline-trivial-computed',
      'prefer-keyed-object-map',
      'prefer-to-refs-props',
    ],
    testFiles: [
      'no-chinese-user-text-literal-rule.test.ts',
      'no-dom-query-in-component-rule.test.ts',
      'no-dynamic-i18n-t-key-rule.test.ts',
      'no-i18n-t-fallback-rule.test.ts',
      'no-missing-static-asset-import-rule.test.ts',
      'no-redundant-indexed-record-satisfies-rule.test.ts',
      'no-redundant-watch-source-compare-rule.test.ts',
      'no-static-px-inline-style-rule.test.ts',
      'no-type-import-used-as-value-rule.test.ts',
      'prefer-inline-single-use-map-rule.test.ts',
      'prefer-inline-trivial-computed-rule.test.ts',
      'prefer-keyed-object-map-rule.test.ts',
      'prefer-to-refs-props-rule.test.ts',
    ],
    utilities: ['eslint-rule-context.mjs', 'i18n-call.mjs'],
  },
  {
    configName: 'load-more-trigger',
    kitPath: 'source/files/2026-07-24 - 把无限滚动触底触发器抽成 composable：虚拟列表、哨兵和滚动兜底/kits/load-more-trigger-guardrail',
    oldNamespaces: ['load-more-trigger'],
    ruleNames: ['prefer-load-more-trigger'],
    testFiles: ['prefer-load-more-trigger-rule.test.ts'],
    utilities: ['eslint-rule-context.mjs'],
  },
]

function assertWithin(parent: string, target: string) {
  const relativePath = path.relative(parent, target)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`拒绝写入目标目录之外的路径：${target}`)
  }
}

function toPascalCase(ruleName: string) {
  return ruleName
    .split('-')
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}

function toImportName(ruleName: string) {
  const pascalName = toPascalCase(ruleName)
  return `${pascalName.charAt(0).toLowerCase()}${pascalName.slice(1)}`
}

function createRulesIndex(ruleNames: string[]) {
  const imports = ruleNames
    .map(ruleName => `import ${toImportName(ruleName)} from './${ruleName}/index.mjs'`)
    .join('\n')
  const rules = ruleNames
    .map(ruleName => `  '${ruleName}': ${toImportName(ruleName)},`)
    .join('\n')

  return `${imports}\n\nexport const rules = {\n${rules}\n}\n\nexport default {\n  rules,\n}\n`
}

function replacePluginBlock(content: string) {
  const pluginsIndex = content.indexOf('plugins:')
  if (pluginsIndex === -1) return content

  const blockStart = content.indexOf('{', pluginsIndex)
  if (blockStart === -1) return content

  let depth = 0
  let quote: string | null = null
  let escapeNext = false

  for (let index = blockStart; index < content.length; index += 1) {
    const char = content[index]

    if (quote) {
      if (escapeNext) {
        escapeNext = false
      } else if (char === '\\') {
        escapeNext = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') depth -= 1

    if (depth === 0) {
      const lineStart = content.lastIndexOf('\n', pluginsIndex) + 1
      const indent = content.slice(lineStart, pluginsIndex)
      const childIndent = `${indent}  `
      const replacement = `plugins: {\n${childIndent}'${namespace}': sheng,\n${indent}}`
      return `${content.slice(0, pluginsIndex)}${replacement}${content.slice(index + 1)}`
    }
  }

  return content
}

function insertShengImport(content: string) {
  if (content.includes("from '@sheng/eslint-plugin'")) return content

  const lines = content.trimStart().split(/\r?\n/u)
  let insertIndex = 0

  while (insertIndex < lines.length && lines[insertIndex].startsWith('import ')) {
    insertIndex += 1
  }

  lines.splice(insertIndex, 0, "import sheng from '@sheng/eslint-plugin'")
  if (lines[insertIndex + 1] !== '') lines.splice(insertIndex + 1, 0, '')
  return lines.join('\n')
}

function normalizeTopLevelImports(content: string) {
  const lines = content.trimStart().split(/\r?\n/u)
  const imports: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (line.startsWith('import ')) {
      imports.push(line)
      index += 1
      continue
    }

    if (line === '' && imports.length > 0) {
      index += 1
      continue
    }

    break
  }

  if (imports.length === 0) return lines.join('\n')

  return `${imports.join('\n')}\n\n${lines.slice(index).join('\n').trimStart()}`
}

function updateExampleConfig(content: string, oldNamespaces: string[]) {
  let nextContent = content
    .replace(/^import .*from ['"].*(?:copy\/eslint\/rules|eslint\/rules).*['"]\r?\n/gmu, '')

  for (const oldNamespace of oldNamespaces) {
    nextContent = nextContent.replaceAll(`${oldNamespace}/`, `${namespace}/`)
  }

  nextContent = replacePluginBlock(nextContent)
  nextContent = insertShengImport(nextContent)
  nextContent = normalizeTopLevelImports(nextContent)

  return nextContent.replace(/\n{3,}/gu, '\n\n')
}

function upsertBlock(content: string, marker: string, block: string) {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const fullBlock = `${start}\n${block.trim()}\n${end}`
  const existingPattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'u')

  if (existingPattern.test(content)) return content.replace(existingPattern, fullBlock)

  const firstLineEnd = content.indexOf('\n')
  if (firstLineEnd === -1) return `${content}\n\n${fullBlock}\n`

  return `${content.slice(0, firstLineEnd + 1)}\n${fullBlock}\n${content.slice(firstLineEnd + 1)}`
}

function updateMarkdownConfigSnippets(content: string, oldNamespaces: string[]) {
  let nextContent = content

  nextContent = nextContent.replace(/^import .*from ['"].*(?:copy\/eslint\/rules|eslint\/rules).*['"]$/gmu, "import sheng from '@sheng/eslint-plugin'")

  for (const oldNamespace of oldNamespaces) {
    nextContent = nextContent.replace(
      new RegExp(`(['"])${oldNamespace}\\1:\\s*[A-Za-z_$][\\w$]*`, 'gu'),
      `'${namespace}': sheng`,
    )
  }

  return nextContent
}

function createReadmeBlock(mapping: KitMapping) {
  const ruleIds = mapping.ruleNames.map(ruleName => `\`${namespace}/${ruleName}\``).join('、')
  return `
## 首选：安装 \`@sheng/eslint-plugin\`

这组 ESLint 规则现在以 \`@sheng/eslint-plugin\` 为主来源。优先安装包并使用 \`sheng.configs['${mapping.configName}']\`，或按需手动开启 ${ruleIds}。

如果当前项目不想引入 npm 包，再按 \`FILES.json\` 复制 \`copy/eslint/rules/\` 里的源码快照；这个快照由 \`@sheng/eslint-plugin\` 同步生成。
`
}

function createAgentPromptBlock(mapping: KitMapping) {
  const ruleIds = mapping.ruleNames.map(ruleName => `${namespace}/${ruleName}`).join('、')
  return `
> 默认优先安装 \`@sheng/eslint-plugin\`，使用 \`sheng.configs['${mapping.configName}']\` 或手动开启 ${ruleIds}。只有目标项目不愿引入包时，再按 \`FILES.json\` 复制 \`copy/eslint/rules/\` 快照，并同步测试和示例里的 ruleId。
`
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

async function copyRules(mapping: KitMapping) {
  const ruleNames = mapping.ruleNames
  const rulesRoot = path.join(blogRoot, mapping.kitPath, 'copy/eslint/rules')
  assertWithin(blogRoot, rulesRoot)
  await rm(rulesRoot, { force: true, recursive: true })
  await mkdir(rulesRoot, { recursive: true })

  for (const ruleName of ruleNames) {
    const targetRuleRoot = path.join(rulesRoot, ruleName)
    await cp(path.join(packageRoot, 'src/rules', ruleName), targetRuleRoot, { recursive: true })

    const docsRulePath = path.join(packageRoot, 'docs/rules', `${ruleName}.md`)
    if (await pathExists(docsRulePath)) {
      const docsContent = await readFile(docsRulePath, 'utf8')
      await writeFile(path.join(targetRuleRoot, 'README.md'), docsContent)
    }
  }

  if (mapping.utilities.length > 0) {
    const utilitiesRoot = path.join(rulesRoot, 'utils')
    await mkdir(utilitiesRoot, { recursive: true })

    for (const utilityName of mapping.utilities) {
      await cp(path.join(packageRoot, 'src/rules/utils', utilityName), path.join(utilitiesRoot, utilityName))
    }
  }

  await writeFile(path.join(rulesRoot, 'index.mjs'), createRulesIndex(ruleNames))
}

async function copyTests(mapping: KitMapping) {
  const testsRoot = path.join(blogRoot, mapping.kitPath, 'copy/tests/unit/architecture')
  assertWithin(blogRoot, testsRoot)
  await rm(testsRoot, { force: true, recursive: true })
  await mkdir(testsRoot, { recursive: true })

  for (const testFile of mapping.testFiles) {
    const sourcePath = path.join(packageRoot, 'tests/unit/architecture', testFile)
    const targetPath = path.join(testsRoot, testFile)
    let content = await readFile(sourcePath, 'utf8')
    content = content.replaceAll('../../../src/rules/', '../../../eslint/rules/')
    await writeFile(targetPath, content)
  }
}

async function updateExample(mapping: KitMapping) {
  const examplePath = path.join(blogRoot, mapping.kitPath, 'examples/eslint.config.mjs')
  if (!(await pathExists(examplePath))) return

  const content = await readFile(examplePath, 'utf8')
  await writeFile(examplePath, updateExampleConfig(content, mapping.oldNamespaces))
}

async function updateDocs(mapping: KitMapping) {
  for (const fileName of ['README.md', 'AGENT_PROMPT.md']) {
    const filePath = path.join(blogRoot, mapping.kitPath, fileName)
    if (!(await pathExists(filePath))) continue

    let content = await readFile(filePath, 'utf8')
    for (const oldNamespace of mapping.oldNamespaces) {
      content = content.replaceAll(`${oldNamespace}/`, `${namespace}/`)
    }
    content = updateMarkdownConfigSnippets(content, mapping.oldNamespaces)
    const block = fileName === 'README.md' ? createReadmeBlock(mapping) : createAgentPromptBlock(mapping)
    await writeFile(filePath, upsertBlock(content, 'sheng-eslint-plugin', block))
  }
}

for (const mapping of kitMappings) {
  await copyRules(mapping)
  await copyTests(mapping)
  await updateExample(mapping)
  await updateDocs(mapping)
  console.log(`[sync-blog-kits] ${mapping.configName}: ${mapping.kitPath}`)
}

console.log(`[sync-blog-kits] 已同步 ${kitMappings.length} 个 ESLint kit。`)
