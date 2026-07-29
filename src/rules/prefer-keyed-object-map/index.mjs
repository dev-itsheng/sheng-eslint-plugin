import ts from 'typescript'

const EQUALITY_OPERATORS = new Set(['===', '=='])

function unwrapExpression(node) {
  if (['ChainExpression', 'TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression'].includes(node?.type)) {
    return unwrapExpression(node.expression)
  }

  return node
}

function getPropertyName(node) {
  if (!node) return null
  if (node.type === 'Identifier') return node.name
  if (node.type === 'Literal') return String(node.value)
  return null
}

function isLiteralLike(node) {
  const unwrapped = unwrapExpression(node)
  if (unwrapped?.type === 'Literal') return true
  return unwrapped?.type === 'TemplateLiteral' && unwrapped.expressions.length === 0
}

function isEnumLikeMemberExpression(node) {
  const unwrapped = unwrapExpression(node)
  if (unwrapped?.type !== 'MemberExpression') return false

  const object = unwrapExpression(unwrapped.object)
  const objectName = getPropertyName(object)
  if (!objectName) return false

  // 枚举 / 常量对象通常用 PascalCase 或 UPPER_CASE 命名。这个判断只用于
  // 判断哪一侧更像“枚举值”，不参与 autofix，所以宁可保守一点。
  return /^[A-Z]/.test(objectName) || /^[A-Z0-9_]+$/.test(objectName)
}

function isLikelyComparableValue(node) {
  const unwrapped = unwrapExpression(node)
  if (!unwrapped) return false
  if (isLiteralLike(unwrapped)) return true
  if (isEnumLikeMemberExpression(unwrapped)) return true
  return unwrapped.type === 'Identifier'
}

function getDiscriminantAndComparedValue(test, sourceCode) {
  const unwrappedTest = unwrapExpression(test)
  if (unwrappedTest?.type !== 'BinaryExpression') return null
  if (!EQUALITY_OPERATORS.has(unwrappedTest.operator)) return null

  const left = unwrapExpression(unwrappedTest.left)
  const right = unwrapExpression(unwrappedTest.right)

  if (isLiteralLike(left) && !isLiteralLike(right)) {
    return { discriminant: right, comparedValue: left, test: unwrappedTest }
  }

  if (isLiteralLike(right) && !isLiteralLike(left)) {
    return { discriminant: left, comparedValue: right, test: unwrappedTest }
  }

  if (isEnumLikeMemberExpression(left) && !isEnumLikeMemberExpression(right)) {
    return { discriminant: right, comparedValue: left, test: unwrappedTest }
  }

  if (isEnumLikeMemberExpression(right) && !isEnumLikeMemberExpression(left)) {
    return { discriminant: left, comparedValue: right, test: unwrappedTest }
  }

  if (left?.type === 'Identifier' && isLikelyComparableValue(right)) {
    return { discriminant: left, comparedValue: right, test: unwrappedTest }
  }

  if (right?.type === 'Identifier' && isLikelyComparableValue(left)) {
    return { discriminant: right, comparedValue: left, test: unwrappedTest }
  }

  // 两侧都是成员表达式时，例如 current.value === Status.Ready，依赖文本形态
  // 难以完全判断。这里先不报，避免把对象字段互比误判成离散枚举映射。
  void sourceCode
  return null
}

function collectTernaryChain(node, sourceCode) {
  const cases = []
  let current = node

  while (current?.type === 'ConditionalExpression') {
    const comparison = getDiscriminantAndComparedValue(current.test, sourceCode)
    if (!comparison) return null

    cases.push({
      node: current,
      ...comparison,
    })
    current = unwrapExpression(current.alternate)
  }

  return { cases, fallback: current }
}

function getReturnArgument(statement) {
  if (!statement) return null
  if (statement.type === 'ReturnStatement') return statement.argument
  if (statement.type !== 'BlockStatement') return null
  if (statement.body.length !== 1) return null

  return getReturnArgument(statement.body[0])
}

function getStatementIndex(statement) {
  if (statement.parent?.type !== 'BlockStatement') return -1

  return statement.parent.body.indexOf(statement)
}

function collectElseIfReturnChain(node, sourceCode) {
  const cases = []
  let current = node

  while (current?.type === 'IfStatement') {
    const comparison = getDiscriminantAndComparedValue(current.test, sourceCode)
    if (!comparison) return null
    if (!getReturnArgument(current.consequent)) return null

    cases.push({
      node: current,
      ...comparison,
    })

    const alternate = current.alternate
    if (!alternate) return { cases, fallback: null }
    if (alternate.type !== 'IfStatement') return { cases, fallback: getReturnArgument(alternate) }

    current = alternate
  }

  return null
}

function collectSiblingIfReturnChain(node, sourceCode) {
  if (node.alternate) return null
  if (node.parent?.type !== 'BlockStatement') return null

  const cases = []
  const siblings = node.parent.body
  let index = getStatementIndex(node)

  while (index >= 0 && index < siblings.length) {
    const current = siblings[index]
    if (current.type !== 'IfStatement') break
    if (current.alternate) break

    const comparison = getDiscriminantAndComparedValue(current.test, sourceCode)
    if (!comparison) return null
    if (!getReturnArgument(current.consequent)) return null

    cases.push({
      node: current,
      ...comparison,
    })
    index += 1
  }

  const fallback = getReturnArgument(siblings[index])
  if (!fallback) return null

  return { cases, fallback }
}

function collectIfReturnChain(node, sourceCode) {
  if (node.parent?.type === 'IfStatement' && node.parent.alternate === node) return null

  const elseIfChain = collectElseIfReturnChain(node, sourceCode)
  if (elseIfChain?.fallback) return elseIfChain

  return collectSiblingIfReturnChain(node, sourceCode)
}

function getParserServices(context) {
  return context.sourceCode?.parserServices ?? context.parserServices ?? null
}

function getTypeAtLocation(context, node) {
  const services = getParserServices(context)
  if (!services) return null

  try {
    if (typeof services.getTypeAtLocation === 'function') {
      return services.getTypeAtLocation(node)
    }

    if (services.program && services.esTreeNodeToTSNodeMap) {
      const checker = services.program.getTypeChecker()
      const tsNode = services.esTreeNodeToTSNodeMap.get(node)
      return checker.getTypeAtLocation(tsNode)
    }
  } catch {
    return null
  }

  return null
}

function isLiteralType(type) {
  if (!type) return false
  if (typeof type.isStringLiteral === 'function' && type.isStringLiteral()) return true
  if (typeof type.isNumberLiteral === 'function' && type.isNumberLiteral()) return true
  if (type.intrinsicName === 'true' || type.intrinsicName === 'false') return true
  return ['string', 'number', 'boolean'].includes(typeof type.value)
}

function getClosedLiteralUnionSize(type) {
  if (!type) return 0

  const unionTypes = typeof type.isUnion === 'function' && type.isUnion() ? type.types : []
  if (!Array.isArray(unionTypes) || unionTypes.length === 0) return 0
  if (!unionTypes.every(isLiteralType)) return 0

  return unionTypes.length
}

function getEnumUnionSizeFromType(type) {
  if (!type) return 0

  const unionTypes = typeof type.isUnion === 'function' && type.isUnion() ? type.types : [type]
  const enumMemberNames = new Set()

  for (const item of unionTypes) {
    const symbol = item.symbol ?? item.aliasSymbol
    const parentSymbol = symbol?.parent ?? item.aliasSymbol?.parent
    if (!parentSymbol) return 0

    const declarations = parentSymbol.declarations ?? []
    if (!declarations.some((declaration) => ts.isEnumDeclaration(declaration))) return 0

    enumMemberNames.add(symbol?.name ?? String(item.value))
  }

  return enumMemberNames.size
}

function getAstLiteralUnionSize(typeNode, typeAliasLiteralUnionSizes) {
  if (!typeNode) return 0

  if (typeNode.type === 'TSTypeReference' && typeNode.typeName?.type === 'Identifier') {
    return typeAliasLiteralUnionSizes.get(typeNode.typeName.name) ?? 0
  }

  if (typeNode.type !== 'TSUnionType') return 0

  const literalTypes = typeNode.types.filter((item) => item.type === 'TSLiteralType')
  return literalTypes.length === typeNode.types.length ? typeNode.types.length : 0
}

function readTypeAnnotationUnionSize(node, typeAliasLiteralUnionSizes) {
  const typeNode = node?.typeAnnotation?.typeAnnotation
  return getAstLiteralUnionSize(typeNode, typeAliasLiteralUnionSizes)
}

function findVariableInScope(scope, name) {
  let currentScope = scope

  while (currentScope) {
    const variable = currentScope.variables?.find((item) => item.name === name)
    if (variable) return variable
    currentScope = currentScope.upper
  }

  return null
}

function getStaticLiteralUnionSize(context, node, typeAliasLiteralUnionSizes) {
  if (node?.type !== 'Identifier') return 0

  const scope = context.sourceCode?.getScope?.(node)
  const variable = scope ? findVariableInScope(scope, node.name) : null
  const def = variable?.defs?.[0]
  if (!def) return 0

  const directTypeSize = readTypeAnnotationUnionSize(def.name, typeAliasLiteralUnionSizes)
  if (directTypeSize) return directTypeSize

  if (def.type === 'Variable' && def.node?.type === 'VariableDeclarator') {
    return readTypeAnnotationUnionSize(def.node.id, typeAliasLiteralUnionSizes)
  }

  return 0
}

function isSameDiscriminant(cases, sourceCode) {
  const [firstCase] = cases
  const firstText = sourceCode.getText(firstCase.discriminant)

  return cases.every((item) => sourceCode.getText(item.discriminant) === firstText)
}

function shouldSkipNestedChain(node) {
  return node.parent?.type === 'ConditionalExpression' && unwrapExpression(node.parent.alternate) === node
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提醒同一个离散 key 的分支优先改成对象字面量 + key 映射。',
    },
    messages: {
      preferKeyedObjectMap:
        '{{discriminant}} 的多个离散值分支更适合用对象字面量 + key 表达；如果分支值需要按需计算，请用函数映射，避免对象字面量提前执行所有分支。',
      preferTypedBinaryMap:
        '{{discriminant}} 是封闭二值类型，这个分支可以改成对象字面量 + key，避免未来新增状态时把 else 误当兜底。',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    const reported = new WeakSet()
    const typeAliasLiteralUnionSizes = new Map()

    function rememberTypeAliases(node) {
      for (const statement of node.body) {
        if (statement.type !== 'TSTypeAliasDeclaration') continue

        const unionSize = getAstLiteralUnionSize(statement.typeAnnotation, typeAliasLiteralUnionSizes)
        if (unionSize) {
          typeAliasLiteralUnionSizes.set(statement.id.name, unionSize)
        }
      }
    }

    function getDiscriminantClosedSize(discriminant) {
      return (
        getClosedLiteralUnionSize(getTypeAtLocation(context, discriminant)) ||
        getEnumUnionSizeFromType(getTypeAtLocation(context, discriminant)) ||
        getStaticLiteralUnionSize(context, discriminant, typeAliasLiteralUnionSizes)
      )
    }

    function report(node, messageId, discriminant) {
      if (reported.has(node)) return
      reported.add(node)

      context.report({
        node,
        messageId,
        data: {
          discriminant: sourceCode.getText(discriminant),
        },
      })
    }

    function checkConditionalExpression(node) {
      if (shouldSkipNestedChain(node)) return

      const chain = collectTernaryChain(node, sourceCode)
      if (!chain || chain.cases.length === 0) return
      if (!isSameDiscriminant(chain.cases, sourceCode)) return

      if (chain.cases.length >= 2) {
        report(node, 'preferKeyedObjectMap', chain.cases[0].discriminant)
        return
      }

      const [singleCase] = chain.cases
      const unionSize = getDiscriminantClosedSize(singleCase.discriminant)
      if (unionSize === 2) {
        report(node, 'preferTypedBinaryMap', singleCase.discriminant)
      }
    }

    function checkIfStatement(node) {
      const chain = collectIfReturnChain(node, sourceCode)
      if (!chain || chain.cases.length === 0) return
      if (!isSameDiscriminant(chain.cases, sourceCode)) return

      if (chain.cases.length >= 2) {
        report(node, 'preferKeyedObjectMap', chain.cases[0].discriminant)
        return
      }

      const [singleCase] = chain.cases
      const unionSize = getDiscriminantClosedSize(singleCase.discriminant)
      if (unionSize === 2) {
        report(node, 'preferTypedBinaryMap', singleCase.discriminant)
      }
    }

    return {
      Program: rememberTypeAliases,
      ConditionalExpression: checkConditionalExpression,
      IfStatement: checkIfStatement,
    }
  },
}
