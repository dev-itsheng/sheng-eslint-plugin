import { pascalCase, splitByCase } from 'scule'

const QUOTE_RE = /["']/g

function stripQuery(value) {
  return String(value).split('?')[0] ?? ''
}

function dirname(value) {
  const normalized = stripQuery(value).replaceAll('\\', '/')
  const index = normalized.lastIndexOf('/')

  return index === -1 ? '.' : normalized.slice(0, index) || '/'
}

function basename(value, extension = '') {
  const normalized = stripQuery(value).replaceAll('\\', '/')
  const name = normalized.slice(normalized.lastIndexOf('/') + 1)

  return extension && name.endsWith(extension) ? name.slice(0, -extension.length) : name
}

function extname(value) {
  const name = basename(value)
  const index = name.lastIndexOf('.')

  return index <= 0 ? '' : name.slice(index)
}

/**
 * Vendored from Nuxt 4.4.7 `resolveComponentNameSegments` in `nuxt/dist/index.mjs`.
 *
 * Nuxt 没有公开导出这段“路径前缀和文件名去重”的规则；这里只保留这一个私有
 * helper 的小副本，公开的 `splitByCase` / `pascalCase` 继续用 `scule`，避免我们
 * 手写公共工具后和 Nuxt 依赖漂移。架构测试会对照 `.nuxt/components.d.ts`，用于
 * 提醒 Nuxt 升级后这里是否需要同步。
 */
export function resolveNuxtComponentNameSegments(fileName, prefixParts) {
  const fileNameParts = splitByCase(fileName)
  const fileNamePartsContent = fileNameParts.join('/').toLowerCase()
  const componentNameParts = prefixParts.flatMap((part) => splitByCase(part))
  let index = prefixParts.length - 1
  const matchedSuffix = []

  while (index >= 0) {
    const prefixPart = prefixParts[index]
    matchedSuffix.unshift(...splitByCase(prefixPart).map((part) => part.toLowerCase()))
    const matchedSuffixContent = matchedSuffix.join('/')

    if (
      fileNamePartsContent === matchedSuffixContent ||
      fileNamePartsContent.startsWith(`${matchedSuffixContent}/`) ||
      (prefixPart.toLowerCase() === fileNamePartsContent && prefixParts[index + 1] && prefixParts[index] === prefixParts[index + 1])
    ) {
      componentNameParts.length = index
    }

    index--
  }

  return [...componentNameParts, ...fileNameParts]
}

export function resolveNuxtComponentNameFromRelativePath(relativePath, options = {}) {
  const pathPrefix = options.pathPrefix ?? true
  const prefix = options.prefix ?? ''
  const cleanPath = stripQuery(relativePath)
  const directory = dirname(cleanPath)
  const fileBaseName = basename(cleanPath, extname(cleanPath))
  const directoryPrefix = directory === '.' ? '' : directory
  // ESLint 只能拿到 `app/components` 下的相对路径；这里先模拟 Nuxt 传入
  // `resolveComponentNameSegments` 前准备好的 path prefix，再交给上面的私有逻辑。
  const prefixParts = [
    ...splitByCase(prefix),
    ...(pathPrefix !== false ? splitByCase(directoryPrefix) : []),
  ]
  const fileName = fileBaseName.toLowerCase() === 'index'
    ? pathPrefix === false ? basename(directory) : ''
    : fileBaseName.replace(QUOTE_RE, '')

  return pascalCase(resolveNuxtComponentNameSegments(fileName, prefixParts))
}
