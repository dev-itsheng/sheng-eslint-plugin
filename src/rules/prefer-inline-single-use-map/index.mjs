function unwrapExpression(node) {
  if (
    [
      'ChainExpression',
      'ParenthesizedExpression',
      'TSAsExpression',
      'TSSatisfiesExpression',
      'TSNonNullExpression',
      'TSTypeAssertion',
    ].includes(node?.type)
  ) {
    return unwrapExpression(node.expression)
  }

  return node
}

function isLiteralMapExpression(node) {
  const unwrapped = unwrapExpression(node)
  if (unwrapped?.type === 'ArrayExpression') {
    return unwrapped.elements.length > 0 && unwrapped.elements.every((element) => element?.type !== 'SpreadElement')
  }

  if (unwrapped?.type !== 'ObjectExpression') return false
  return unwrapped.properties.length > 0 && unwrapped.properties.every((property) => property.type !== 'SpreadElement')
}

function isConstVariableDeclarator(node) {
  return node.parent?.type === 'VariableDeclaration' && node.parent.kind === 'const'
}

function isExportedVariableDeclaration(node) {
  const declaration = node.parent
  return ['ExportNamedDeclaration', 'ExportDefaultDeclaration'].includes(declaration?.parent?.type)
}

function isVueTemplateNode(node) {
  let current = node

  while (current) {
    if (current.type === 'VExpressionContainer') return true
    current = current.parent
  }

  return false
}

function isTransparentUseWrapper(parent, child) {
  if (!parent) return false
  if (
    [
      'ChainExpression',
      'ParenthesizedExpression',
      'TSAsExpression',
      'TSNonNullExpression',
      'TSTypeAssertion',
    ].includes(parent.type)
  ) {
    return parent.expression === child
  }

  return false
}

function findIndexedMapAccess(identifier) {
  let expression = identifier
  let parent = identifier.parent

  while (isTransparentUseWrapper(parent, expression)) {
    expression = parent
    parent = parent.parent
  }

  if (parent?.type !== 'MemberExpression') return null
  return parent.object === expression ? parent : null
}

function getVariableForDeclarator(sourceCode, declarator) {
  const scopes = sourceCode.scopeManager?.scopes ?? []

  for (const scope of scopes) {
    const variable = scope.variables?.find((item) => item.defs?.some((definition) => definition.node === declarator))
    if (variable) return variable
  }

  return null
}

function getReadReferences(variable, declarator) {
  return variable.references.filter((reference) => {
    if (reference.identifier === declarator.id) return false
    if (typeof reference.isRead === 'function') return reference.isRead()
    return !reference.init
  })
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示只被索引读取一次的对象 / 数组映射表直接内联到使用处。',
    },
    messages: {
      preferInlineSingleUseMap:
        '{{name}} 是只被索引读取一次的字面量映射表；请把对象 / 数组字面量直接内联到使用处，避免额外命名制造没有复用价值的中间层。',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    const candidates = []

    return {
      VariableDeclarator(node) {
        if (!isConstVariableDeclarator(node)) return
        if (node.id.type !== 'Identifier') return
        if (isExportedVariableDeclaration(node)) return
        if (!isLiteralMapExpression(node.init)) return

        candidates.push(node)
      },
      'Program:exit'() {
        for (const candidate of candidates) {
          const variable = getVariableForDeclarator(sourceCode, candidate)
          if (!variable) continue

          const readReferences = getReadReferences(variable, candidate)
          if (readReferences.length !== 1) continue

          const [reference] = readReferences
          if (isVueTemplateNode(reference.identifier)) continue
          if (!findIndexedMapAccess(reference.identifier)) continue

          context.report({
            node: candidate.id,
            messageId: 'preferInlineSingleUseMap',
            data: {
              name: candidate.id.name,
            },
          })
        }
      },
    }
  },
}
