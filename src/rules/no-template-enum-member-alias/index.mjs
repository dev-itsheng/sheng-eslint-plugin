import ts from 'typescript'

function getParserServices(context) {
  return context.sourceCode?.parserServices ?? context.parserServices ?? null
}

function getAliasedSymbol(checker, symbol) {
  if (!symbol) return null
  if (symbol.flags & ts.SymbolFlags.Alias) return checker.getAliasedSymbol(symbol)
  return symbol
}

function isEnumIdentifier(context, identifier, localEnumNames) {
  if (localEnumNames.has(identifier.name)) return true

  const services = getParserServices(context)
  if (!services?.program || !services.esTreeNodeToTSNodeMap) return false

  try {
    const checker = services.program.getTypeChecker()
    const tsNode = services.esTreeNodeToTSNodeMap.get(identifier)
    const symbol = getAliasedSymbol(checker, checker.getSymbolAtLocation(tsNode))
    return Boolean(symbol?.declarations?.some(declaration => ts.isEnumDeclaration(declaration)))
  } catch {
    return false
  }
}

function getEnumMemberAlias(init) {
  if (init?.type !== 'MemberExpression') return null
  if (init.computed) return null
  if (init.object.type !== 'Identifier') return null
  if (init.property.type !== 'Identifier') return null

  return {
    enumIdentifier: init.object,
    memberName: init.property.name,
  }
}

function isConstVariableDeclarator(node) {
  return node.parent?.type === 'VariableDeclaration' && node.parent.kind === 'const'
}

function isReferenceIdentifier(node) {
  const parent = node.parent
  if (!parent) return true

  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return false
  if (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) return false

  return true
}

function visitExpression(node, visitor, visited = new WeakSet()) {
  if (!node || typeof node.type !== 'string' || visited.has(node)) return

  visited.add(node)
  visitor(node)

  for (const [key, value] of Object.entries(node)) {
    if (['parent', 'loc', 'range', 'tokens', 'comments'].includes(key)) continue
    if (!value) continue

    if (Array.isArray(value)) {
      for (const child of value) {
        visitExpression(child, visitor, visited)
      }
      continue
    }

    if (typeof value === 'object' && typeof value.type === 'string') {
      visitExpression(value, visitor, visited)
    }
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示 Vue template 可以直接使用 script setup 里的 enum member，不需要额外声明一比一中转常量。',
    },
    messages: {
      noTemplateEnumMemberAlias:
        '{{aliasName}} 只是 {{enumMemberText}} 的 template 中转常量；Vue template 可以直接使用 enum member，请在模板里写 {{enumMemberText}} 并删除这层 alias。',
    },
    schema: [],
  },
  create(context) {
    const enumMemberAliases = new Map()
    const localEnumNames = new Set()
    const pendingTemplateReferences = []
    const reportedNodes = new WeakSet()
    const sourceCode = context.sourceCode

    function reportTemplateReference(node, aliasName) {
      if (reportedNodes.has(node)) return

      const alias = enumMemberAliases.get(aliasName)
      if (!alias) {
        pendingTemplateReferences.push({ node, aliasName })
        return
      }

      reportedNodes.add(node)
      context.report({
        node,
        messageId: 'noTemplateEnumMemberAlias',
        data: {
          aliasName,
          enumMemberText: alias.enumMemberText,
        },
      })
    }

    const scriptVisitor = {
      TSEnumDeclaration(node) {
        localEnumNames.add(node.id.name)
      },
      VariableDeclarator(node) {
        if (!isConstVariableDeclarator(node)) return
        if (node.id.type !== 'Identifier') return

        const alias = getEnumMemberAlias(node.init)
        if (!alias) return
        if (!isEnumIdentifier(context, alias.enumIdentifier, localEnumNames)) return

        enumMemberAliases.set(node.id.name, {
          enumMemberText: sourceCode.getText(node.init),
        })
      },
      'Program:exit'() {
        for (const reference of pendingTemplateReferences) {
          if (!enumMemberAliases.has(reference.aliasName)) continue
          reportTemplateReference(reference.node, reference.aliasName)
        }
      },
    }

    const templateVisitor = {
      VExpressionContainer(node) {
        visitExpression(node.expression, (expression) => {
          if (expression.type !== 'Identifier') return
          if (!isReferenceIdentifier(expression)) return

          reportTemplateReference(expression, expression.name)
        })
      },
    }

    return sourceCode.parserServices?.defineTemplateBodyVisitor?.(templateVisitor, scriptVisitor) ?? scriptVisitor
  },
}
