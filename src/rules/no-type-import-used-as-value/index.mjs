function findVariableInScope(scope, name) {
  let currentScope = scope

  while (currentScope) {
    const variable = currentScope.variables?.find((item) => item.name === name)
    if (variable) return variable
    currentScope = currentScope.upper
  }

  return null
}

function isTypeOnlyImportSpecifier(specifier, importKind) {
  return importKind === 'type' || specifier.importKind === 'type'
}

function isImportLocalIdentifier(node) {
  return (
    ['ImportSpecifier', 'ImportDefaultSpecifier', 'ImportNamespaceSpecifier'].includes(node.parent?.type) &&
    (node.parent.local === node || node.parent.imported === node)
  )
}

function isNonReferenceIdentifier(node) {
  const parent = node.parent
  if (!parent) return false

  if (
    parent.type === 'ExportSpecifier' &&
    (parent.exportKind === 'type' || (parent.parent?.type === 'ExportNamedDeclaration' && parent.parent.exportKind === 'type'))
  ) {
    return true
  }

  if (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) return true
  if (parent.type === 'MethodDefinition' && parent.key === node && !parent.computed) return true
  if (parent.type === 'PropertyDefinition' && parent.key === node && !parent.computed) return true
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return true
  if (parent.type === 'LabeledStatement') return true
  if (parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') return true

  return false
}

function isInsideTypeSyntax(node) {
  let current = node
  let parent = node.parent

  while (parent) {
    if (parent.type.startsWith('TS')) {
      // `foo as Type` / `foo!` / `foo satisfies Type` 里的 expression 仍是运行时值；
      // 只有右侧 typeAnnotation、typeParameters 等 TS 子树才属于纯类型位置。
      if (
        ['TSAsExpression', 'TSTypeAssertion', 'TSSatisfiesExpression', 'TSNonNullExpression', 'TSInstantiationExpression'].includes(parent.type) &&
        parent.expression === current
      ) {
        return false
      }

      return true
    }

    current = parent
    parent = parent.parent
  }

  return false
}

function isReferenceToTypeOnlyImport(context, node, typeOnlyImportLocals) {
  const scope = context.sourceCode.getScope(node)
  const variable = findVariableInScope(scope, node.name)
  if (!variable) return false

  return variable.defs.some((definition) => definition.type === 'ImportBinding' && typeOnlyImportLocals.has(definition.name))
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '提示 type-only import 不能在运行时表达式里当值使用。',
    },
    messages: {
      noTypeImportUsedAsValue:
        '{{name}} 来自 type-only import，但这里按运行时值使用；请改成普通 import，或只在类型位置使用它。',
    },
    schema: [],
  },
  create(context) {
    const typeOnlyImportLocals = new WeakSet()
    const typeOnlyImportNames = new Set()

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (!specifier.local || !isTypeOnlyImportSpecifier(specifier, node.importKind)) continue

          typeOnlyImportLocals.add(specifier.local)
          typeOnlyImportNames.add(specifier.local.name)
        }
      },
      Identifier(node) {
        if (!typeOnlyImportNames.has(node.name)) return
        if (isImportLocalIdentifier(node)) return
        if (isNonReferenceIdentifier(node)) return
        if (isInsideTypeSyntax(node)) return
        if (!isReferenceToTypeOnlyImport(context, node, typeOnlyImportLocals)) return

        context.report({
          node,
          messageId: 'noTypeImportUsedAsValue',
          data: {
            name: node.name,
          },
        })
      },
    }
  },
}
