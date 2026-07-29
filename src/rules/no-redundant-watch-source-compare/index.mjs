const EQUALITY_OPERATORS = new Set(['===', '!==', '==', '!='])

function isNode(value) {
  return value && typeof value === 'object' && typeof value.type === 'string'
}

function isFunctionLike(node) {
  return ['FunctionExpression', 'ArrowFunctionExpression'].includes(node?.type)
}

function isIdentifier(node, name) {
  return node?.type === 'Identifier' && node.name === name
}

function getPropertyName(node) {
  if (!node) return null
  if (node.type === 'Identifier') return node.name
  if (node.type === 'Literal') return String(node.value)
  return null
}

function isWatchCall(node) {
  if (node.callee.type === 'Identifier') return node.callee.name === 'watch'
  if (node.callee.type !== 'MemberExpression') return false
  const propertyName = node.callee.computed && node.callee.property.type === 'Literal' ? String(node.callee.property.value) : getPropertyName(node.callee.property)
  return propertyName === 'watch'
}

function hasDeepWatchOption(node) {
  const options = node.arguments[2]
  if (options?.type !== 'ObjectExpression') return false

  return options.properties.some((property) => {
    if (property.type !== 'Property') return false
    const keyName = property.computed && property.key.type === 'Literal' ? String(property.key.value) : getPropertyName(property.key)
    if (keyName !== 'deep') return false
    return !(property.value.type === 'Literal' && property.value.value === false)
  })
}

function visitNode(node, visitor, root = node) {
  if (!isNode(node)) return
  if (node !== root && isFunctionLike(node)) return

  visitor(node)

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue
    if (Array.isArray(value)) {
      for (const item of value) visitNode(item, visitor, root)
      continue
    }
    visitNode(value, visitor, root)
  }
}

function getRedundantComparison(node, nextName, previousName) {
  if (node.type !== 'BinaryExpression' || !EQUALITY_OPERATORS.has(node.operator)) return null

  const nextOnLeft = isIdentifier(node.left, nextName) && isIdentifier(node.right, previousName)
  const previousOnLeft = isIdentifier(node.left, previousName) && isIdentifier(node.right, nextName)
  if (!nextOnLeft && !previousOnLeft) return null

  return {
    node,
    operator: node.operator,
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止在单 source watch 回调中冗余比较 next value 和 previous value。',
    },
    messages: {
      redundantCompare: '单 source watch 只有 source 值变化时才会执行，{{nextName}} {{operator}} {{previousName}} 是冗余判断；请直接保留真正的业务条件。',
    },
    schema: [],
  },
  create(context) {
    function checkWatchCall(node) {
      if (!isWatchCall(node)) return
      if (node.arguments[0]?.type === 'ArrayExpression') return
      if (hasDeepWatchOption(node)) return

      const callback = node.arguments[1]
      if (!isFunctionLike(callback)) return
      const [nextParam, previousParam] = callback.params
      if (nextParam?.type !== 'Identifier' || previousParam?.type !== 'Identifier') return

      visitNode(callback.body, (currentNode) => {
        const redundantComparison = getRedundantComparison(currentNode, nextParam.name, previousParam.name)
        if (!redundantComparison) return

        context.report({
          node: redundantComparison.node,
          messageId: 'redundantCompare',
          data: {
            nextName: nextParam.name,
            previousName: previousParam.name,
            operator: redundantComparison.operator,
          },
        })
      })
    }

    return {
      CallExpression: checkWatchCall,
    }
  },
}
