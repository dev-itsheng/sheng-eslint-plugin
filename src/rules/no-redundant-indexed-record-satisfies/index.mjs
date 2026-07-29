function unwrapExpression(node) {
  if (
    [
      'ChainExpression',
      'ParenthesizedExpression',
      'TSAsExpression',
      'TSNonNullExpression',
      'TSTypeAssertion',
    ].includes(node?.type)
  ) {
    return unwrapExpression(node.expression)
  }

  return node
}

function isTransparentParent(parent, child) {
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

function getOuterParent(node) {
  let expression = node
  let parent = node.parent

  while (isTransparentParent(parent, expression)) {
    expression = parent
    parent = parent.parent
  }

  return { expression, parent }
}

function isObjectLiteralWithoutSpread(node) {
  const expression = unwrapExpression(node)
  if (expression?.type !== 'ObjectExpression') return false
  return expression.properties.length > 0 && expression.properties.every((property) => property.type !== 'SpreadElement')
}

function getTypeReferenceName(node) {
  if (node?.type !== 'TSTypeReference') return null
  if (node.typeName?.type !== 'Identifier') return null
  return node.typeName.name
}

function getTypeReferenceParams(node) {
  return node?.typeArguments?.params ?? node?.typeParameters?.params ?? []
}

function getRecordTypeArguments(typeAnnotation) {
  if (getTypeReferenceName(typeAnnotation) !== 'Record') return null

  const params = getTypeReferenceParams(typeAnnotation)
  if (params.length !== 2) return null

  return params
}

function isBroadRecordKeyType(node) {
  if (!node) return false
  if (['TSStringKeyword', 'TSNumberKeyword', 'TSSymbolKeyword', 'TSAnyKeyword', 'TSUnknownKeyword'].includes(node.type)) return true
  if (getTypeReferenceName(node) === 'PropertyKey') return true
  if (node.type === 'TSUnionType') return node.types.some(isBroadRecordKeyType)
  return false
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示完整 Record 映射表被立即索引时去掉冗余 satisfies。',
    },
    messages: {
      noRedundantIndexedRecordSatisfies:
        '对象字面量完整映射后马上索引读取时，不需要再套 satisfies Record<...>；直接写对象字面量 + key 即可。部分映射请继续用 helper 或 Partial<Record<...>> 明确拓宽。',
    },
    schema: [],
  },
  create(context) {
    return {
      TSSatisfiesExpression(node) {
        if (!isObjectLiteralWithoutSpread(node.expression)) return

        const recordTypeArguments = getRecordTypeArguments(node.typeAnnotation)
        if (!recordTypeArguments) return
        if (isBroadRecordKeyType(recordTypeArguments[0])) return

        const { expression, parent } = getOuterParent(node)
        if (parent?.type !== 'MemberExpression') return
        if (parent.object !== expression) return
        if (!parent.computed) return

        context.report({
          node: node.typeAnnotation,
          messageId: 'noRedundantIndexedRecordSatisfies',
        })
      },
    }
  },
}
