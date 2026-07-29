import path from 'node:path'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'

const DEFAULT_DOM_QUERY_METHODS = [
  'querySelector',
  'querySelectorAll',
  'getElementById',
  'getElementsByClassName',
  'getElementsByName',
  'getElementsByTagName',
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

function unwrapChainExpression(node) {
  return node?.type === 'ChainExpression' ? node.expression : node
}

function getCalleeMemberExpression(node) {
  const callee = unwrapChainExpression(node.callee)
  if (callee?.type !== 'MemberExpression') return null

  return unwrapChainExpression(callee)
}

function getMemberPropertyName(memberExpression) {
  const property = unwrapChainExpression(memberExpression.property)
  if (!property) return null
  if (!memberExpression.computed && property.type === 'Identifier') return property.name
  if (memberExpression.computed && property.type === 'Literal') return String(property.value)

  return null
}

function resolveOptions(options) {
  const option = options[0] ?? {}

  return {
    methods: new Set(Array.isArray(option.methods) ? option.methods : DEFAULT_DOM_QUERY_METHODS),
    ignoredPathPatterns: Array.isArray(option.ignoredPathPatterns) ? option.ignoredPathPatterns : [],
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示组件和页面不要用 DOM 查找 API，优先使用 template ref 或 function ref。',
    },
    messages: {
      noDomQuery:
        '组件/页面里不要用 {{name}} 查找 DOM；优先用 template ref / function ref 显式拿到元素。第三方 SDK 容器等必须查全局 DOM 时，请在 ignoredPathPatterns 里精确放行。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
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
    const compatibleContext = createRuleContextCompat(context, 'no-dom-query-in-component', { requireSourceCode: true })
    const cwd = compatibleContext.cwd
    const filename = normalizeFilename(compatibleContext.filename, cwd)
    const { methods, ignoredPathPatterns } = resolveOptions(compatibleContext.options)

    if (matchesIgnoredPath(filename, ignoredPathPatterns)) return {}

    const visitor = {
      CallExpression(node) {
        const memberExpression = getCalleeMemberExpression(node)
        if (!memberExpression) return

        const methodName = getMemberPropertyName(memberExpression)
        if (!methodName || !methods.has(methodName)) return

        compatibleContext.report({
          node: memberExpression.property,
          messageId: 'noDomQuery',
          data: {
            name: methodName,
          },
        })
      },
    }

    return compatibleContext.parserServices?.defineTemplateBodyVisitor?.(visitor, visitor) ?? visitor
  },
}
