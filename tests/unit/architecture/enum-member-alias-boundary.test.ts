import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = process.cwd()
const SCAN_TARGETS = [
  'app/components/common/Dialog',
  'app/pages/settings',
]
const SOURCE_EXTENSIONS = new Set(['.ts', '.vue'])
const ENUM_MEMBER_ALIAS_PATTERN = /\b(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s+([A-Z][A-Za-z0-9_$]*(?:Mode|Section|Variant|Kind)\.[A-Za-z_$][\w$]*)/g

function listSourceFiles(path: string): string[] {
  const fullPath = join(REPO_ROOT, path)
  if (!existsSync(fullPath)) return []

  const stats = statSync(fullPath)
  if (stats.isFile()) return SOURCE_EXTENSIONS.has(extname(fullPath)) ? [fullPath] : []

  const files: string[] = []
  for (const entry of readdirSync(fullPath).sort()) {
    files.push(...listSourceFiles(join(path, entry)))
  }
  return files
}

function findEnumMemberAliases(source: string) {
  return Array.from(source.matchAll(ENUM_MEMBER_ALIAS_PATTERN)).map((match) => {
    const [, aliasName, enumMember] = match
    return `${aliasName} = ${enumMember}`
  })
}

describe('枚举成员别名边界', () => {
  it('能识别给 enum member 再包一层局部常量的写法', () => {
    expect(findEnumMemberAliases('const promptMode = DialogMode.Prompt')).toEqual([
      'promptMode = DialogMode.Prompt',
    ])
  })

  it('目标目录不为 enum member 再包一层局部常量', () => {
    const violations = SCAN_TARGETS.flatMap(listSourceFiles).flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return findEnumMemberAliases(source).map(alias => `${relative(REPO_ROOT, file)}: ${alias}`)
    })

    expect(violations).toEqual([])
  })
})
