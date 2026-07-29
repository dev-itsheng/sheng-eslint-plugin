import { getRuleFilename, toPosixPath } from '../utils/eslint-rule-context.mjs'

const DEFAULT_CONTEXT_COMPOSABLE_NAMES = [
  'inject',
  'provide',
  'useCookie',
  'useNuxtApp',
  'useRequestHeaders',
  'useRequestURL',
  'useRoute',
  'useRouter',
  'useState',
]

const CONTROL_FLOW_NODE_TYPES = new Set([
  'ConditionalExpression',
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'IfStatement',
  'LogicalExpression',
  'SwitchCase',
  'SwitchStatement',
  'TryStatement',
  'WhileStatement',
])

const FUNCTION_NODE_TYPES = new Set(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression'])

function getBasename(filename) {
  return toPosixPath(filename).split('/').pop() ?? ''
}

function isVueFile(filename) {
  return getBasename(filename).endsWith('.vue')
}

function isUseComposableFile(filename) {
  return /^use[A-Z].*\.[cm]?[jt]s$/.test(getBasename(filename))
}

function unwrapExpression(node) {
  if (['ChainExpression', 'TSAsExpression', 'TSNonNullExpression', 'TSTypeAssertion'].includes(node?.type)) {
    return unwrapExpression(node.expression)
  }

  return node
}

function isFunctionNode(node) {
  return FUNCTION_NODE_TYPES.has(node?.type)
}

function getMemberPropertyName(node) {
  if (node?.property?.type === 'Identifier') return node.property.name
  if (node?.property?.type === 'Literal') return String(node.property.value)
  return null
}

function getCalleeName(callee) {
  const unwrapped = unwrapExpression(callee)
  if (unwrapped?.type === 'Identifier') return unwrapped.name
  if (unwrapped?.type === 'MemberExpression' && !unwrapped.computed) return getMemberPropertyName(unwrapped)
  return null
}

function getFunctionName(node) {
  if (!isFunctionNode(node)) return null
  if (node.id?.type === 'Identifier') return node.id.name

  const parent = node.parent
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') return parent.id.name
  if (parent?.type === 'Property' && parent.key?.type === 'Identifier') return parent.key.name
  if (parent?.type === 'MethodDefinition' && parent.key?.type === 'Identifier') return parent.key.name
  return null
}

function isComposableFunction(node, filename) {
  const functionName = getFunctionName(node)
  if (functionName === 'setup') return true
  if (/^use[A-Z]/.test(functionName ?? '')) return true
  return node.parent?.type === 'ExportDefaultDeclaration' && isUseComposableFile(filename)
}

function getNearestFunction(node) {
  let current = node.parent
  while (current) {
    if (isFunctionNode(current)) return current
    current = current.parent
  }
  return null
}

function getProgram(node) {
  let current = node
  while (current?.parent) {
    current = current.parent
  }
  return current?.type === 'Program' ? current : null
}

function getAllowedBoundary(node, filename) {
  const nearestFunction = getNearestFunction(node)
  if (nearestFunction) {
    if (!isComposableFunction(nearestFunction, filename)) return null
    return nearestFunction.body?.type === 'BlockStatement' ? nearestFunction.body : null
  }

  return isVueFile(filename) ? getProgram(node) : null
}

function findBoundaryStatement(node, boundary) {
  let current = node
  let parent = current.parent

  while (parent && parent !== boundary) {
    if (isFunctionNode(parent) || CONTROL_FLOW_NODE_TYPES.has(parent.type)) return null
    current = parent
    parent = parent.parent
  }

  return parent === boundary ? current : null
}

function nodeContainsAwait(node) {
  if (!node || typeof node.type !== 'string') return false
  if (node.type === 'AwaitExpression') return true
  if (isFunctionNode(node)) return false

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue

    if (Array.isArray(value)) {
      if (value.some((item) => nodeContainsAwait(item))) return true
      continue
    }

    if (value && typeof value === 'object' && nodeContainsAwait(value)) return true
  }

  return false
}

function hasPreviousTopLevelAwait(statement, boundary) {
  const body = boundary.body
  if (!Array.isArray(body)) return false

  const statementIndex = body.indexOf(statement)
  if (statementIndex <= 0) return false

  return body.slice(0, statementIndex).some((sibling) => nodeContainsAwait(sibling))
}

function resolveOptions(options) {
  const option = options[0] ?? {}
  return {
    names: new Set(Array.isArray(option.names) ? option.names : DEFAULT_CONTEXT_COMPOSABLE_NAMES),
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '限制依赖当前 Vue/Nuxt 上下文的 API 只能在 setup 或 use*.ts composable 主函数顶层同步调用。',
    },
    messages: {
      afterAwait:
        '{{name}} 依赖当前 Vue/Nuxt 上下文，请在 setup 或 use*.ts composable 主函数顶层、await 之前同步调用，再通过闭包传给后续逻辑。',
      nestedContextComposable:
        '{{name}} 依赖当前 Vue/Nuxt 上下文，请在 setup 或 use*.ts composable 主函数顶层同步调用，再通过闭包传给内部函数或回调。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          names: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = getRuleFilename(context)
    const { names } = resolveOptions(context.options)

    return {
      CallExpression(node) {
        const name = getCalleeName(node.callee)
        if (!name || !names.has(name)) return

        const boundary = getAllowedBoundary(node, filename)
        const statement = boundary ? findBoundaryStatement(node, boundary) : null

        if (!boundary || !statement) {
          context.report({
            node,
            messageId: 'nestedContextComposable',
            data: { name },
          })
          return
        }

        if (hasPreviousTopLevelAwait(statement, boundary)) {
          context.report({
            node,
            messageId: 'afterAwait',
            data: { name },
          })
        }
      },
    }
  },
}
