import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'

const defaultTargetFilePatterns = [
  /(?:^|\/)app\/composables\/use[A-Z][^/]*\.(?:ts|js|mjs|tsx|jsx|vue)$/u,
  /(?:^|\/)app\/composables\/use[A-Z][^/]*\/index\.(?:ts|js|mjs|tsx|jsx|vue)$/u,
]
const reactiveFactoryNames = new Set(['ref', 'shallowRef', 'reactive', 'computed'])
const mutableConstructorNames = new Set(['Map', 'Set', 'WeakMap', 'WeakSet'])
const defaultAllowedHelperNames = new Set(['useClientOnlySourceState'])

function normalizeFilename(filename) {
  return filename.replaceAll('\\', '/')
}

function shouldCheckFile(filename, patterns = defaultTargetFilePatterns) {
  const normalized = normalizeFilename(filename)
  return patterns.some((pattern) => pattern.test(normalized))
}

function getIdentifierName(node) {
  if (!node) return ''
  if (node.type === 'Identifier') return node.name
  if (node.type === 'MemberExpression' && !node.computed) return getIdentifierName(node.property)
  return ''
}

function getCalleeName(node) {
  if (!node) return ''
  if (node.type === 'CallExpression') return getIdentifierName(node.callee)
  if (node.type === 'NewExpression') return getIdentifierName(node.callee)
  return ''
}

function isAllowedClientOnlySource(node, allowedHelperNames) {
  return node?.type === 'CallExpression' && allowedHelperNames.has(getCalleeName(node))
}

function createsReactiveState(node) {
  return node?.type === 'CallExpression' && reactiveFactoryNames.has(getCalleeName(node))
}

function createsMutableCollection(node) {
  return node?.type === 'NewExpression' && mutableConstructorNames.has(getCalleeName(node))
}

function hasDomLikeTypeAnnotation(id, sourceCode) {
  if (!id?.typeAnnotation) return false

  const annotationText = sourceCode.getText(id.typeAnnotation)
  return /\b(?:HTMLElement|Element|ResizeObserver|IntersectionObserver|AbortController|Window|Document)\b/u.test(annotationText)
}

function isMutableModuleState(node, parent, sourceCode) {
  if (parent?.kind === 'let') return true
  if (createsReactiveState(node.init)) return true
  if (createsMutableCollection(node.init)) return true
  if (hasDomLikeTypeAnnotation(node.id, sourceCode)) return true
  return false
}

function codeHasImportMetaServerReturn(code) {
  if (!/\bimport\.meta\.server\b/u.test(code)) return false
  return /\breturn\b/u.test(code)
}

function getOptions(context) {
  const options = context.options?.[0] ?? {}
  const allowedHelperNames = new Set([...defaultAllowedHelperNames, ...(options.allowedHelperNames ?? [])])
  const ignoredPathPatterns = (options.ignoredPathPatterns ?? []).map((pattern) => new RegExp(pattern, 'u'))

  return {
    allowedHelperNames,
    ignoredPathPatterns,
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '提醒 Nuxt use* composable 里的模块级可变状态必须显式声明 SSR 策略。',
    },
    messages: {
      missingSsrGuard:
        '{{name}} 在模块级创建了共享状态，但默认导出的 composable 没有显式 SSR 分支；请返回 no-op / request-local state，或改用 useClientOnlySourceState 这类 client-only source helper。',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowedHelperNames: {
            type: 'array',
            items: { type: 'string' },
          },
          ignoredPathPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },
  create(rawContext) {
    const context = createRuleContextCompat(rawContext, 'no-ssr-unsafe-module-state', {
      requireSourceCode: true,
    })
    const { allowedHelperNames, ignoredPathPatterns } = getOptions(context)
    const filename = normalizeFilename(context.filename)

    if (!shouldCheckFile(filename) || ignoredPathPatterns.some((pattern) => pattern.test(filename))) {
      return {}
    }

    const moduleStateDeclarations = []
    const namedFunctionSources = new Map()
    let functionDepth = 0
    let defaultComposableHasSsrGuard = false

    function rememberFunctionSource(node) {
      if (node.id?.name) {
        namedFunctionSources.set(node.id.name, context.sourceCode.getText(node))
      }
    }

    return {
      ':function'() {
        functionDepth += 1
      },
      ':function:exit'(node) {
        rememberFunctionSource(node)
        functionDepth -= 1
      },
      ExportDefaultDeclaration(node) {
        const declaration = node.declaration
        if (declaration.type === 'FunctionDeclaration' || declaration.type === 'FunctionExpression' || declaration.type === 'ArrowFunctionExpression') {
          defaultComposableHasSsrGuard = codeHasImportMetaServerReturn(context.sourceCode.getText(declaration))
          return
        }

        if (declaration.type === 'Identifier') {
          const functionSource = namedFunctionSources.get(declaration.name)
          defaultComposableHasSsrGuard = functionSource ? codeHasImportMetaServerReturn(functionSource) : defaultComposableHasSsrGuard
        }
      },
      VariableDeclarator(node) {
        if (functionDepth > 0) return
        if (isAllowedClientOnlySource(node.init, allowedHelperNames)) return
        if (!isMutableModuleState(node, node.parent, context.sourceCode)) return

        moduleStateDeclarations.push(node)
      },
      'Program:exit'() {
        if (!moduleStateDeclarations.length || defaultComposableHasSsrGuard) return

        for (const node of moduleStateDeclarations) {
          context.report({
            node,
            messageId: 'missingSsrGuard',
            data: {
              name: context.sourceCode.getText(node.id),
            },
          })
        }
      },
    }
  },
}
