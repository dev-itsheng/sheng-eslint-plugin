import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rules } from '../src/rules/index.js'
import { ruleGroupDetails, ruleGroups } from '../src/rules/groups.js'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRulesRoot = path.join(packageRoot, 'docs/rules')
const sourceRulesRoot = path.join(packageRoot, 'src/rules')

async function pathExists(filePath: string) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

function getConfiguredRules() {
  return new Set(Object.values(ruleGroups).flat())
}

function fail(message: string): never {
  throw new Error(`[docs:check] ${message}`)
}

const ruleNames = Object.keys(rules).sort()
const configuredRules = getConfiguredRules()

for (const [groupName, details] of Object.entries(ruleGroupDetails)) {
  for (const [fieldName, value] of Object.entries(details)) {
    if (typeof value === 'string' && /[<>]/.test(value)) {
      fail(`规则分组 ${groupName}.${fieldName} 包含裸尖括号，VitePress sidebar SSR 可能把它当成 HTML 标签。`)
    }
  }
}

for (const ruleName of ruleNames) {
  if (!configuredRules.has(ruleName)) {
    fail(`规则 ${ruleName} 没有登记到任何 config 分组。`)
  }

  const docsPath = path.join(docsRulesRoot, `${ruleName}.md`)
  if (!(await pathExists(docsPath))) {
    fail(`缺少规则文档：docs/rules/${ruleName}.md`)
  }

  const docsContent = await readFile(docsPath, 'utf8')
  const expectedRuleId = `@sheng/${ruleName}`
  if (!docsContent.includes(`# ${expectedRuleId}`)) {
    fail(`docs/rules/${ruleName}.md 缺少标题 ${expectedRuleId}。`)
  }
  if (!docsContent.includes(`ruleName: "${ruleName}"`)) {
    fail(`docs/rules/${ruleName}.md 缺少 ruleName frontmatter。`)
  }
  if (!docsContent.includes(`'${expectedRuleId}': 'warn'`)) {
    fail(`docs/rules/${ruleName}.md 缺少单规则接入示例。`)
  }

  const sourceReadmePath = path.join(sourceRulesRoot, ruleName, 'README.md')
  if (!(await pathExists(sourceReadmePath))) {
    fail(`缺少源码短 README：src/rules/${ruleName}/README.md`)
  }

  const sourceReadme = await readFile(sourceReadmePath, 'utf8')
  if (!sourceReadme.includes(`# ${expectedRuleId}`)) {
    fail(`src/rules/${ruleName}/README.md 缺少标题 ${expectedRuleId}。`)
  }
  if (!sourceReadme.includes(`../../../docs/rules/${ruleName}.md`)) {
    fail(`src/rules/${ruleName}/README.md 没有指向 docs/rules/${ruleName}.md。`)
  }
}

const docsRuleFiles = (await readdir(docsRulesRoot))
  .filter(fileName => fileName.endsWith('.md') && fileName !== 'index.md')
  .map(fileName => path.basename(fileName, '.md'))
  .sort()

const unknownDocs = docsRuleFiles.filter(ruleName => !rules[ruleName])
if (unknownDocs.length > 0) {
  fail(`docs/rules 存在未注册规则文档：${unknownDocs.join(', ')}`)
}

if (docsRuleFiles.length !== ruleNames.length) {
  fail(`规则文档数量不一致：docs=${docsRuleFiles.length}, rules=${ruleNames.length}`)
}

console.log(`[docs:check] ${ruleNames.length} 条规则文档已对齐。`)
