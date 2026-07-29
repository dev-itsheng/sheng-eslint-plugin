import path from 'node:path'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'

// camelCase 场景常写成 loadMoreSentinelElement，Sentinel 前不是单词边界；
// 这里只做关键词存在性判断，再叠加 loadMore / hasMore / nextIndex 信号降噪。
const LOAD_MORE_SENTINEL_PATTERN = /sentinel/i
const LOAD_MORE_TRIGGER_PATTERNS = [
  /\bloadMore[A-Za-z0-9_$]*\b/,
  /\bhasMore\b/,
  /\bnextIndex\b/,
]

function toPosixPath(value) {
  return String(value).replaceAll(path.sep, '/')
}

function normalizeFilename(filename, cwd) {
  const absoluteFilename = path.isAbsolute(filename) ? filename : path.resolve(cwd, filename)
  return toPosixPath(path.relative(cwd, absoluteFilename))
}

function matchesIgnoredPath(filename, ignoredPathPatterns) {
  return ignoredPathPatterns.some((pattern) => new RegExp(pattern).test(filename))
}

function resolveOptions(options) {
  const option = options[0] ?? {}

  return {
    ignoredPathPatterns: Array.isArray(option.ignoredPathPatterns) ? option.ignoredPathPatterns : [],
  }
}

function hasLoadMoreSignal(sourceText) {
  return LOAD_MORE_SENTINEL_PATTERN.test(sourceText) && LOAD_MORE_TRIGGER_PATTERNS.some((pattern) => pattern.test(sourceText))
}

function getImportedUseIntersectionObserverSpecifier(node) {
  if (node.source.value !== '@vueuse/core') return null

  return (
    node.specifiers.find((specifier) => specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === 'useIntersectionObserver') ??
    null
  )
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示疑似无限滚动场景不要手写 IntersectionObserver，优先使用 useLoadMoreTrigger。',
    },
    messages: {
      preferLoadMoreTrigger:
        '疑似手写无限滚动 useIntersectionObserver；请优先用 useLoadMoreTrigger 统一处理 sentinel、scroll fallback 和数据变化后的补偿重检。普通曝光/懒加载等非 load-more 场景请调整命名或用 ignoredPathPatterns 精确放行。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoredPathPatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const compat = createRuleContextCompat(context, 'prefer-load-more-trigger', { requireSourceCode: true })
    const cwd = compat.cwd
    const filename = normalizeFilename(compat.filename, cwd)
    const { ignoredPathPatterns } = resolveOptions(context.options)

    if (matchesIgnoredPath(filename, ignoredPathPatterns)) return {}

    return {
      ImportDeclaration(node) {
        const sourceText = compat.sourceCode.getText()
        if (!hasLoadMoreSignal(sourceText)) return

        const specifier = getImportedUseIntersectionObserverSpecifier(node)
        if (!specifier) return

        context.report({
          node: specifier,
          messageId: 'preferLoadMoreTrigger',
        })
      },
    }
  },
}
