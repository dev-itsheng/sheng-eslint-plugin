import path from 'node:path'
import { getLiteralSource, getRuleCwd, getRuleFilename, matchesPattern, normalizeRelativeFilename, toPosixPath } from '../utils/eslint-rule-context.mjs'

function stripImportQuery(source) {
  return String(source).split('?')[0]
}

function importSourceIsRelative(source) {
  return source.startsWith('./') || source.startsWith('../')
}

function resolveAliasedSourcePath(source, cwd, aliases) {
  for (const [aliasPrefix, targetPrefix] of aliases) {
    if (source.startsWith(aliasPrefix)) return path.resolve(cwd, targetPrefix, source.slice(aliasPrefix.length))
  }

  return null
}

function resolveSourceAbsolutePath(filename, source, cwd, aliases) {
  const cleanSource = stripImportQuery(source)
  const fileDirectory = path.dirname(path.resolve(cwd, filename))

  if (importSourceIsRelative(cleanSource)) return path.resolve(fileDirectory, cleanSource)
  return resolveAliasedSourcePath(cleanSource, cwd, aliases)
}

function pathIsUnder(absolutePath, rootPath) {
  const relativePath = toPosixPath(path.relative(rootPath, absolutePath))
  return Boolean(relativePath && !relativePath.startsWith('../') && !path.isAbsolute(relativePath))
}

function getLayerName(absolutePath, cwd, roots) {
  if (!absolutePath) return null

  for (const root of roots) {
    const absoluteRoot = path.resolve(cwd, root)
    if (pathIsUnder(absolutePath, absoluteRoot)) return root
  }

  return null
}

function resolveOptions(options) {
  const option = options[0] ?? {}
  const aliases = Array.isArray(option.aliases)
    ? option.aliases
    : [
        ['~/components/', 'app/components/'],
        ['@/components/', 'app/components/'],
        ['~/pages/', 'app/pages/'],
        ['@/pages/', 'app/pages/'],
        ['~/app/components/', 'app/components/'],
        ['@/app/components/', 'app/components/'],
        ['~/app/pages/', 'app/pages/'],
        ['@/app/pages/', 'app/pages/'],
        ['~~/app/components/', 'app/components/'],
        ['@@/app/components/', 'app/components/'],
        ['~~/app/pages/', 'app/pages/'],
        ['@@/app/pages/', 'app/pages/'],
      ]

  return {
    aliases,
    globalComposableRoot: typeof option.globalComposableRoot === 'string' ? option.globalComposableRoot : 'app/composables',
    ignoredImportPatterns: Array.isArray(option.ignoredImportPatterns) ? option.ignoredImportPatterns : [],
    ignoredPathPatterns: Array.isArray(option.ignoredPathPatterns) ? option.ignoredPathPatterns : [],
    uiLayerRoots: Array.isArray(option.uiLayerRoots) ? option.uiLayerRoots : ['app/components', 'app/pages'],
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止全局 composable 反向 import UI 层。',
    },
    messages: {
      noGlobalComposableImportUiLayer:
        '{{globalComposableRoot}} 是全局 source/action 层，不应该 import {{uiLayer}}。请把共享逻辑移到全局 composable、utils、shared 或稳定 types 层；如果只是组件私有逻辑，请改成就近 composable。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          aliases: {
            type: 'array',
            items: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: { type: 'string' },
            },
          },
          globalComposableRoot: { type: 'string' },
          ignoredImportPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
          ignoredPathPatterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
          uiLayerRoots: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const cwd = getRuleCwd(context)
    const filename = normalizeRelativeFilename(getRuleFilename(context), cwd)
    const { aliases, globalComposableRoot, ignoredImportPatterns, ignoredPathPatterns, uiLayerRoots } = resolveOptions(context.options)

    if (!filename.startsWith(`${globalComposableRoot}/`) || matchesPattern(filename, ignoredPathPatterns)) return {}

    function reportIfUiLayerSource(node, source) {
      if (typeof source !== 'string' || matchesPattern(stripImportQuery(source), ignoredImportPatterns)) return

      const absoluteSourcePath = resolveSourceAbsolutePath(filename, source, cwd, aliases)
      const uiLayer = getLayerName(absoluteSourcePath, cwd, uiLayerRoots)
      if (!uiLayer) return

      context.report({
        node,
        messageId: 'noGlobalComposableImportUiLayer',
        data: {
          globalComposableRoot,
          uiLayer,
        },
      })
    }

    return {
      ExportAllDeclaration(node) {
        reportIfUiLayerSource(node, getLiteralSource(node.source))
      },
      ExportNamedDeclaration(node) {
        reportIfUiLayerSource(node, getLiteralSource(node.source))
      },
      ImportDeclaration(node) {
        reportIfUiLayerSource(node, getLiteralSource(node.source))
      },
      ImportExpression(node) {
        reportIfUiLayerSource(node, getLiteralSource(node.source))
      },
    }
  },
}
