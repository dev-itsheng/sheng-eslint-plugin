import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from '@vue/compiler-sfc'
import { resolveNuxtComponentNameFromRelativePath } from '../../../src/rules/utils/nuxt-component-name.mjs'

/**
 * 模板里的自动导入组件名守卫。
 *
 * `nuxt-auto-import/no-explicit-vue-component-import` 会提示删除手动 import，但真正能不能删，
 * 取决于 template 里的标签是否等于 Nuxt 生成的组件名。Nuxt 会把路径和文件名里的
 * 重复片段移除，例如 `Profile/Record/RecordRow.vue` 实际生成
 * `CommonUserProfileRecordRow`，不是按路径硬拼出来的
 * `CommonUserProfileRecordRecordRow`。
 *
 * 这个测试可以只扫当前 owner 范围；它不是业务单测，而是防止下一次“删掉 import
 * 后模板标签猜错”继续漏到运行时。
 */
const REPO_ROOT = process.cwd()
const COMPONENTS_ROOT = join(REPO_ROOT, 'app/components')
const GENERATED_COMPONENTS_DECLARATION = join(REPO_ROOT, '.nuxt/components.d.ts')
const SCANNED_ROOTS = ['app/components/common', 'app/components/home', 'app/pages']
const BUILTIN_COMPONENT_NAMES = new Set([
  'ClientOnly',
  'DevOnly',
  'KeepAlive',
  'NuxtImg',
  'NuxtLayout',
  'NuxtLink',
  'NuxtPage',
  'NuxtPicture',
  'RouterLink',
  'RouterView',
  'Suspense',
  'Teleport',
  'Transition',
  'TransitionGroup',
])

function listFiles(root: string): string[] {
  if (!existsSync(root)) return []

  const files: string[] = []

  for (const entry of readdirSync(root).sort()) {
    const fullPath = join(root, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      files.push(...listFiles(fullPath))
      continue
    }

    if (stats.isFile() && extname(entry) === '.vue') files.push(fullPath)
  }

  return files
}

function collectAutoImportComponentNames(): Set<string> {
  if (existsSync(GENERATED_COMPONENTS_DECLARATION)) {
    const names = new Set<string>()
    const declaration = readFileSync(GENERATED_COMPONENTS_DECLARATION, 'utf8')
    const exportPattern = /^export const (?!Lazy)([A-Z][A-Za-z0-9]*):/gmu

    for (const match of declaration.matchAll(exportPattern)) {
      const name = match[1]
      if (name) names.add(name)
    }

    return names
  }

  // 编辑器和局部测试不一定先生成 `.nuxt/components.d.ts`；这种场景退回
  // 本地 resolver，让规则仍然可以在未 prepare 的工作区提供提示。完整验证
  // 则优先依赖上面的 Nuxt 真实生成结果，避免 resolver 漂移时继续漏报。
  const names = new Set<string>()

  for (const filePath of listFiles(COMPONENTS_ROOT)) {
    names.add(resolveNuxtComponentNameFromRelativePath(relative(COMPONENTS_ROOT, filePath)))
  }

  return names
}

function collectLocallyImportedNames(source: string): Set<string> {
  const names = new Set<string>()
  const importPattern = /import\s+(?:type\s+)?([^'";]+?)\s+from\s+['"][^'"]+['"]/gu

  for (const match of source.matchAll(importPattern)) {
    const importClause = match[1]?.trim()
    if (!importClause) continue

    const [defaultImport, namedImportBlock] = importClause.split('{')
    const defaultName = defaultImport.replace(/,$/u, '').trim()
    if (/^[A-Z][A-Za-z0-9]*$/u.test(defaultName)) names.add(defaultName)

    if (namedImportBlock) {
      for (const namedImport of namedImportBlock.replace('}', '').split(',')) {
        const alias = namedImport
          .split(/\s+as\s+/u)
          .at(-1)
          ?.trim()
        if (alias && /^[A-Z][A-Za-z0-9]*$/u.test(alias)) names.add(alias)
      }
    }
  }

  return names
}

function collectPascalCaseTags(template: string): Set<string> {
  const tags = new Set<string>()
  const tagPattern = /<\s*([A-Z][A-Za-z0-9]*)\b/gu

  for (const match of template.matchAll(tagPattern)) {
    const tag = match[1]
    if (tag) tags.add(tag)
  }

  return tags
}

describe('Nuxt 自动导入组件使用守卫', () => {
  it('指定范围内的 PascalCase 标签都能对应到 Nuxt 组件或本地显式 import', () => {
    const autoImportNames = collectAutoImportComponentNames()
    const missing: string[] = []

    for (const scannedRoot of SCANNED_ROOTS) {
      for (const filePath of listFiles(join(REPO_ROOT, scannedRoot))) {
        const source = readFileSync(filePath, 'utf8')
        const descriptor = parse(source, { filename: filePath }).descriptor
        if (!descriptor.template?.content) continue

        const localImports = collectLocallyImportedNames(source)

        for (const tag of collectPascalCaseTags(descriptor.template.content)) {
          if (BUILTIN_COMPONENT_NAMES.has(tag)) continue
          if (autoImportNames.has(tag)) continue
          if (localImports.has(tag)) continue

          missing.push(`${relative(REPO_ROOT, filePath)}: <${tag}>`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})
