import { getLiteralSource } from '../utils/eslint-rule-context.mjs'

const COMPOSABLE_NAME_PATTERN = /^use[A-Z0-9_]/
const RAW_SOURCE_COMPOSABLE_NAME_PATTERN = /Sources$/

function unwrapExpression(node) {
  if (['ChainExpression', 'TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression'].includes(node?.type)) {
    return unwrapExpression(node.expression)
  }

  return node
}

function isComposableName(name) {
  return typeof name === 'string' && COMPOSABLE_NAME_PATTERN.test(name)
}

function getCalleeName(callee) {
  const unwrapped = unwrapExpression(callee)
  if (unwrapped?.type === 'Identifier') return unwrapped.name
  return null
}

function importSourceIsRelative(source) {
  return source.startsWith('./') || source.startsWith('../')
}

function specifierIsComposable(specifier) {
  return specifier.local?.type === 'Identifier' && isComposableName(specifier.local.name)
}

function getPropertyName(node) {
  if (node.type === 'Identifier') return node.name
  if (node.type === 'Literal') return String(node.value)
  return null
}

function formatMemberExpressionName(node) {
  const unwrapped = unwrapExpression(node)
  if (unwrapped?.type !== 'MemberExpression') return null

  const object = unwrapExpression(unwrapped.object)
  const propertyName = getPropertyName(unwrapped.property)
  if (object?.type !== 'Identifier' || !propertyName) return null
  return `${object.name}.${propertyName}`
}

function collectPatternIdentifiers(pattern, callback) {
  const unwrapped = unwrapExpression(pattern)

  if (unwrapped?.type === 'Identifier') {
    callback(unwrapped)
    return
  }

  if (unwrapped?.type === 'ObjectPattern') {
    for (const property of unwrapped.properties) {
      if (property.type === 'Property') collectPatternIdentifiers(property.value, callback)
      if (property.type === 'RestElement') collectPatternIdentifiers(property.argument, callback)
    }
    return
  }

  if (unwrapped?.type === 'ArrayPattern') {
    for (const element of unwrapped.elements) {
      if (element) collectPatternIdentifiers(element, callback)
    }
    return
  }

  if (unwrapped?.type === 'RestElement') collectPatternIdentifiers(unwrapped.argument, callback)
  if (unwrapped?.type === 'AssignmentPattern') collectPatternIdentifiers(unwrapped.left, callback)
}

function collectPassThroughNodes(node, globalComposableBindings, output = []) {
  const unwrapped = unwrapExpression(node)
  if (!unwrapped) return output

  if (unwrapped.type === 'Identifier') {
    const source = globalComposableBindings.get(unwrapped.name)
    if (source) output.push({ node: unwrapped, name: unwrapped.name, source })
    return output
  }

  if (unwrapped.type === 'MemberExpression') {
    const object = unwrapExpression(unwrapped.object)
    if (object?.type === 'Identifier') {
      const source = globalComposableBindings.get(object.name)
      if (source) output.push({ node: unwrapped, name: formatMemberExpressionName(unwrapped) ?? object.name, source })
    }
    return output
  }

  if (unwrapped.type === 'ObjectExpression') {
    for (const property of unwrapped.properties) {
      if (property.type === 'Property') collectPassThroughNodes(property.value, globalComposableBindings, output)
      if (property.type === 'SpreadElement') collectPassThroughNodes(property.argument, globalComposableBindings, output)
    }
    return output
  }

  if (unwrapped.type === 'ArrayExpression') {
    for (const element of unwrapped.elements) {
      if (element) collectPassThroughNodes(element, globalComposableBindings, output)
    }
    return output
  }

  return output
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提醒不要把全局 composable 返回值原样透传给组件或页面私有 composable。',
    },
    messages: {
      noGlobalComposablePassThrough:
        '不要把全局 composable {{sourceComposable}} 的返回值 {{name}} 原样传给局部 composable {{targetComposable}}；让局部 composable 自己读取全局能力，或只传真实业务输入。',
    },
    schema: [],
  },
  create(context) {
    const localComposableNames = new Set()
    const globalComposableBindings = new Map()

    function calleeIsTrackedGlobalComposable(calleeName) {
      if (!isComposableName(calleeName)) return false
      if (RAW_SOURCE_COMPOSABLE_NAME_PATTERN.test(calleeName)) return false
      return !localComposableNames.has(calleeName)
    }

    return {
      ImportDeclaration(node) {
        const source = getLiteralSource(node.source)
        if (!source || !importSourceIsRelative(source)) return

        for (const specifier of node.specifiers) {
          if (specifierIsComposable(specifier)) localComposableNames.add(specifier.local.name)
        }
      },
      VariableDeclarator(node) {
        const init = unwrapExpression(node.init)
        if (init?.type !== 'CallExpression') return

        const calleeName = getCalleeName(init.callee)
        if (!calleeIsTrackedGlobalComposable(calleeName)) return

        collectPatternIdentifiers(node.id, (identifier) => {
          globalComposableBindings.set(identifier.name, calleeName)
        })
      },
      CallExpression(node) {
        const calleeName = getCalleeName(node.callee)
        if (!calleeName || !localComposableNames.has(calleeName)) return

        const reported = new Set()
        for (const argument of node.arguments) {
          for (const match of collectPassThroughNodes(argument, globalComposableBindings)) {
            const key = `${match.name}:${match.source}`
            if (reported.has(key)) continue
            reported.add(key)

            context.report({
              node: match.node,
              messageId: 'noGlobalComposablePassThrough',
              data: {
                name: match.name,
                sourceComposable: match.source,
                targetComposable: calleeName,
              },
            })
          }
        }
      },
    }
  },
}
