import { readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const includedRoots = ['src', 'docs', 'README.md', 'AGENT_PROMPT.md', 'LICENSE']
const ignoredNames = new Set(['node_modules', '.git', 'coverage', 'dist'])

interface FileIndexEntry {
  path: string
  group: string
  label: string
}

function toPosixPath(value: string) {
  return value.split(path.sep).join('/')
}

function getGroup(relativePath: string) {
  if (relativePath.startsWith('docs/rules/')) return 'docs/rules'
  if (relativePath.startsWith('docs/')) return 'docs'
  if (relativePath.startsWith('src/rules/')) return 'rules'
  if (relativePath.startsWith('src/')) return 'plugin'
  return 'package'
}

function getLabel(relativePath: string) {
  if (relativePath === 'README.md') return 'README'
  if (relativePath === 'AGENT_PROMPT.md') return 'Agent 接入 prompt'
  if (relativePath === 'LICENSE') return 'License'

  const parsed = path.posix.parse(relativePath)
  if (parsed.base === 'index.mjs' || parsed.base === 'index.js') {
    const directoryName = path.posix.basename(parsed.dir)
    return directoryName === 'rules' || directoryName === 'src' ? parsed.dir : directoryName
  }

  return parsed.name
}

async function collectFiles(targetPath: string, results: string[] = []) {
  const stats = await stat(targetPath)

  if (stats.isFile()) {
    results.push(targetPath)
    return results
  }

  if (!stats.isDirectory()) return results

  for (const entry of await readdir(targetPath, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) continue
    await collectFiles(path.join(targetPath, entry.name), results)
  }

  return results
}

const files: string[] = []

for (const root of includedRoots) {
  await collectFiles(path.join(packageRoot, root), files)
}

const entries: FileIndexEntry[] = files
  .map(filePath => toPosixPath(path.relative(packageRoot, filePath)))
  .sort()
  .map(relativePath => ({
    path: relativePath,
    group: getGroup(relativePath),
    label: getLabel(relativePath),
  }))

await writeFile(path.join(packageRoot, 'FILES.json'), `${JSON.stringify(entries, null, 2)}\n`)

console.log(`Generated FILES.json with ${entries.length} files.`)
