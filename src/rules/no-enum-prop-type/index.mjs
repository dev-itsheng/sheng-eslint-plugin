import ts from 'typescript'

function getTypeParameterParams(node) {
  return node?.typeParameters?.params ?? node?.typeArguments?.params ?? []
}

function getTypeNameText(typeName) {
  if (!typeName) return null
  if (typeName.type === 'Identifier') return typeName.name
  if (typeName.type === 'TSQualifiedName') return getTypeNameText(typeName.right)
  return null
}

function getPropertyName(member) {
  const key = member?.key
  if (!key) return 'prop'
  if (key.type === 'Identifier') return key.name
  if (key.type === 'Literal') return String(key.value)
  return 'prop'
}

function getParserServices(context) {
  return context.sourceCode?.parserServices ?? context.parserServices ?? null
}

function getTypeNameSymbol(context, typeReferenceNode) {
  const services = getParserServices(context)
  if (!services?.program || !services.esTreeNodeToTSNodeMap) return null

  try {
    const checker = services.program.getTypeChecker()
    const tsTypeName = services.esTreeNodeToTSNodeMap.get(typeReferenceNode.typeName)
    const symbol = checker.getSymbolAtLocation(tsTypeName)
    if (!symbol) return null
    if (symbol.flags & ts.SymbolFlags.Alias) return checker.getAliasedSymbol(symbol)
    return symbol
  } catch {
    return null
  }
}

function getEnumNameFromTypeReference(context, typeReferenceNode, localEnumNames) {
  const typeName = getTypeNameText(typeReferenceNode.typeName)
  if (typeName && localEnumNames.has(typeName)) return typeName

  const symbol = getTypeNameSymbol(context, typeReferenceNode)
  const enumDeclaration = symbol?.declarations?.find(declaration => ts.isEnumDeclaration(declaration))
  return enumDeclaration ? symbol.name : null
}

function collectTopLevelDeclaration(statement, collections) {
  const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
  if (!declaration) return

  if (declaration.type === 'TSEnumDeclaration') {
    collections.localEnumNames.add(declaration.id.name)
    return
  }

  if (declaration.type === 'TSInterfaceDeclaration') {
    collections.typeDeclarations.set(declaration.id.name, declaration.body.body)
    return
  }

  if (declaration.type === 'TSTypeAliasDeclaration') {
    collections.typeDeclarations.set(declaration.id.name, declaration.typeAnnotation)
  }
}

function inspectTypeNode(typeNode, state) {
  if (!typeNode) return

  if (typeNode.type === 'TSTemplateLiteralType') {
    return
  }

  if (typeNode.type === 'TSTypeReference') {
    const enumName = getEnumNameFromTypeReference(state.context, typeNode, state.localEnumNames)
    if (enumName) {
      if (!state.disallowedEnumNames.has(enumName)) return
      state.report(typeNode, enumName)
      return
    }

    for (const param of getTypeParameterParams(typeNode)) {
      inspectTypeNode(param, state)
    }
    return
  }

  if (typeNode.type === 'TSArrayType') {
    inspectTypeNode(typeNode.elementType, state)
    return
  }

  if (typeNode.type === 'TSUnionType' || typeNode.type === 'TSIntersectionType') {
    for (const item of typeNode.types) {
      inspectTypeNode(item, state)
    }
    return
  }

  if (typeNode.type === 'TSTypeLiteral') {
    for (const member of typeNode.members) {
      inspectMember(member, state)
    }
    return
  }

  if (typeNode.type === 'TSTupleType') {
    for (const item of typeNode.elementTypes) {
      inspectTypeNode(item, state)
    }
    return
  }

  if (typeNode.type === 'TSParenthesizedType' || typeNode.type === 'TSOptionalType' || typeNode.type === 'TSRestType' || typeNode.type === 'TSTypeOperator') {
    inspectTypeNode(typeNode.typeAnnotation, state)
    return
  }

  if (typeNode.type === 'TSIndexedAccessType') {
    inspectTypeNode(typeNode.objectType, state)
    inspectTypeNode(typeNode.indexType, state)
  }
}

function inspectMember(member, state) {
  if (member.type !== 'TSPropertySignature') return

  const previousPropName = state.propName
  state.propName = getPropertyName(member)
  inspectTypeNode(member.typeAnnotation?.typeAnnotation, state)
  state.propName = previousPropName
}

function inspectPropsType(typeNode, state, visited = new Set()) {
  if (!typeNode) return

  if (typeNode.type === 'TSTypeLiteral') {
    for (const member of typeNode.members) {
      inspectMember(member, state)
    }
    return
  }

  if (typeNode.type !== 'TSTypeReference') {
    inspectTypeNode(typeNode, state)
    return
  }

  const typeName = getTypeNameText(typeNode.typeName)
  const declaration = typeName ? state.typeDeclarations.get(typeName) : null
  if (!declaration || visited.has(typeName)) {
    inspectTypeNode(typeNode, state)
    return
  }

  visited.add(typeName)
  if (Array.isArray(declaration)) {
    for (const member of declaration) {
      inspectMember(member, state)
    }
  } else {
    inspectPropsType(declaration, state, visited)
  }
}

function isDefinePropsCall(node) {
  return node.callee?.type === 'Identifier' && node.callee.name === 'defineProps'
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提醒少数需要 string-compatible 调用面的 Vue props 不要直接暴露指定 enum 类型。',
    },
    messages: {
      noEnumPropType:
        '组件 prop {{propName}} 暴露了被配置为 string-compatible 边界的 enum 类型 {{enumName}}；请改用 `${Enum}`、string union 或独立 type alias，让模板和外部调用方能直接传字符串，内部再按 enum/常量处理。',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          disallowedEnumNames: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {}
    const collections = {
      localEnumNames: new Set(),
      typeDeclarations: new Map(),
    }
    const disallowedEnumNames = new Set(options.disallowedEnumNames ?? [])

    return {
      Program(node) {
        for (const statement of node.body) {
          collectTopLevelDeclaration(statement, collections)
        }
      },
      CallExpression(node) {
        if (!isDefinePropsCall(node)) return

        const [propsType] = getTypeParameterParams(node)
        if (!propsType) return

        const state = {
          context,
          disallowedEnumNames,
          localEnumNames: collections.localEnumNames,
          typeDeclarations: collections.typeDeclarations,
          propName: 'prop',
          report: (reportNode, enumName) => {
            context.report({
              node: reportNode,
              messageId: 'noEnumPropType',
              data: {
                propName: state.propName,
                enumName,
              },
            })
          },
        }

        inspectPropsType(propsType, state)
      },
    }
  },
}
