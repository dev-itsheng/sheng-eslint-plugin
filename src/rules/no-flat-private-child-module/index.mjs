import fs from 'node:fs'
import path from 'node:path'
import { getLiteralSource, getParserServices, getRuleCwd, getRuleFilename, normalizeAbsoluteFilename, toPosixPath } from '../utils/eslint-rule-context.mjs'

const CHECKED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue']
const COMPOSABLE_FILE_PATTERN = /^use[A-Z0-9_].*\.[cm]?[jt]sx?$/
const COMPONENT_FILE_PATTERN = /^[A-Z].*\.vue$/
const INDEX_FILE_PATTERN = /^index\.(?:[cm]?[jt]sx?|vue)$/

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function directoryExists(directoryPath) {
  try {
    return fs.statSync(directoryPath).isDirectory()
  } catch {
    return false
  }
}

function readFileText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

function listPeerFiles(directoryPath) {
  try {
    return fs
      .readdirSync(directoryPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && CHECKED_EXTENSIONS.includes(path.extname(entry.name)))
      .map((entry) => path.join(directoryPath, entry.name))
  } catch {
    return []
  }
}

function importSourceIsSameDirectory(source) {
  return source.startsWith('./') && !source.slice(2).includes('/')
}

function resolveModuleFile(fromFile, source) {
  if (!importSourceIsSameDirectory(source)) return null

  const directoryPath = path.dirname(fromFile)
  const rawTargetPath = path.resolve(directoryPath, source)
  if (fileExists(rawTargetPath)) return rawTargetPath

  for (const extension of CHECKED_EXTENSIONS) {
    const candidate = `${rawTargetPath}${extension}`
    if (fileExists(candidate)) return candidate
  }

  return null
}

function targetIsFlatPrivateCandidate(targetFile) {
  const basename = path.basename(targetFile)
  if (INDEX_FILE_PATTERN.test(basename)) return false
  return COMPOSABLE_FILE_PATTERN.test(basename) || COMPONENT_FILE_PATTERN.test(basename)
}

function parentFileCanHostPrivateChildren(filename) {
  return INDEX_FILE_PATTERN.test(path.basename(filename))
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function importSourcesInText(text) {
  const sources = []
  const sourcePattern = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  let match

  while ((match = sourcePattern.exec(text))) {
    const source = match[1] ?? match[2]
    if (source) sources.push(source)
  }

  return sources
}

function vueTagNameForTarget(targetFile) {
  if (path.extname(targetFile) !== '.vue') return null
  return path.basename(targetFile, '.vue')
}

function textReferencesVueTag(text, tagName) {
  return new RegExp(`<${escapeRegExp(tagName)}(?:\\s|/|>)`).test(text)
}

function fileReferencesTarget(filePath, targetFile) {
  const text = readFileText(filePath)
  const importReferencesTarget = importSourcesInText(text).some((source) => resolveModuleFile(filePath, source) === targetFile)
  if (importReferencesTarget) return true

  const tagName = vueTagNameForTarget(targetFile)
  return Boolean(tagName && path.extname(filePath) === '.vue' && textReferencesVueTag(text, tagName))
}

const targetReferenceCache = new Map()

function getSameDirectoryReferenceFiles(targetFile) {
  if (targetReferenceCache.has(targetFile)) return targetReferenceCache.get(targetFile)

  const directoryPath = path.dirname(targetFile)
  const referenceFiles = listPeerFiles(directoryPath)
    .filter((filePath) => filePath !== targetFile)
    .filter((filePath) => fileReferencesTarget(filePath, targetFile))

  targetReferenceCache.set(targetFile, referenceFiles)
  return referenceFiles
}

function targetIsOnlyUsedByCurrentFile(targetFile, filename) {
  const referenceFiles = getSameDirectoryReferenceFiles(targetFile)
  return referenceFiles.length === 1 && referenceFiles[0] === filename
}

function resolveOptions(options) {
  const option = options[0] ?? {}
  return {
    checkedPathPatterns: Array.isArray(option.checkedPathPatterns) ? option.checkedPathPatterns : ['/app/(?:components|pages|composables)/'],
    ignoredPathPatterns: Array.isArray(option.ignoredPathPatterns) ? option.ignoredPathPatterns : [],
  }
}

function matchesAnyPattern(value, patterns) {
  return patterns.some((pattern) => new RegExp(pattern).test(value))
}

function targetFromVueTag(filename, tagName) {
  if (!/^[A-Z]/.test(tagName)) return null

  const candidate = path.join(path.dirname(filename), `${tagName}.vue`)
  return fileExists(candidate) ? candidate : null
}

function reportFlatPrivateChild(context, node, targetFile, filename) {
  context.report({
    node,
    messageId: 'flatPrivateChild',
    data: {
      childName: path.basename(targetFile),
      parentName: path.basename(filename),
    },
  })
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示只有单一父调用方的私有 composable / component 不要和父文件平铺在同一个目录。',
    },
    messages: {
      flatPrivateChild:
        '{{childName}} 只被同目录的 {{parentName}} 使用，不要把父子私有模块平铺成并列文件；请把父模块改成文件夹 facade，或把子模块放进能表达归属关系的子目录。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          checkedPathPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: ['/app/(?:components|pages|composables)/'],
          },
          ignoredPathPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const cwd = getRuleCwd(context)
    const filename = normalizeAbsoluteFilename(getRuleFilename(context), cwd)
    const normalizedFilename = toPosixPath(filename)
    const { checkedPathPatterns, ignoredPathPatterns } = resolveOptions(context.options)

    if (
      !directoryExists(path.dirname(filename)) ||
      parentFileCanHostPrivateChildren(filename) ||
      !matchesAnyPattern(normalizedFilename, checkedPathPatterns) ||
      matchesAnyPattern(normalizedFilename, ignoredPathPatterns)
    ) {
      return {}
    }

    const scriptVisitor = {
      ImportDeclaration(node) {
        const source = getLiteralSource(node.source)
        if (!source) return

        const targetFile = resolveModuleFile(filename, source)
        if (!targetFile || !targetIsFlatPrivateCandidate(targetFile) || !targetIsOnlyUsedByCurrentFile(targetFile, filename)) return

        reportFlatPrivateChild(context, node.source, targetFile, filename)
      },
    }
    const templateVisitor = {
      VElement(node) {
        const targetFile = targetFromVueTag(filename, node.rawName ?? node.name)
        if (!targetFile || !targetIsFlatPrivateCandidate(targetFile) || !targetIsOnlyUsedByCurrentFile(targetFile, filename)) return

        reportFlatPrivateChild(context, node.startTag ?? node, targetFile, filename)
      },
    }

    const parserServices = getParserServices(context)
    if (typeof parserServices?.defineTemplateBodyVisitor === 'function') {
      return parserServices.defineTemplateBodyVisitor(templateVisitor, scriptVisitor)
    }

    return scriptVisitor
  },
}
