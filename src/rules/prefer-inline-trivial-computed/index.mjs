function isComputedCall(node) {
  return node?.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'computed'
}

function getComputedGetterExpression(node) {
  const getter = node.arguments[0]
  if (!getter || getter.params?.length) return null

  if (getter.type === 'ArrowFunctionExpression') {
    if (getter.body.type !== 'BlockStatement') return getter.body

    const statements = getter.body.body.filter((statement) => statement.type !== 'EmptyStatement')
    if (statements.length !== 1) return null

    const [statement] = statements
    return statement.type === 'ReturnStatement' ? statement.argument : null
  }

  if (getter.type === 'FunctionExpression') {
    const statements = getter.body.body.filter((statement) => statement.type !== 'EmptyStatement')
    if (statements.length !== 1) return null

    const [statement] = statements
    return statement.type === 'ReturnStatement' ? statement.argument : null
  }

  return null
}

function resolveOptionSet(value, fallback) {
  return new Set(Array.isArray(value) ? value : fallback)
}

function getStaticCallCalleeName(node) {
  if (node?.type !== 'CallExpression') return null

  if (node.callee.type === 'Identifier') return node.callee.name

  if (node.callee.type === 'MemberExpression' && !node.callee.computed && node.callee.property.type === 'Identifier') {
    return node.callee.property.name
  }

  return null
}

function isStringLiteral(node) {
  return node?.type === 'Literal' && typeof node.value === 'string'
}

function isLiteralLike(node) {
  if (!node) return false
  if (node.type === 'Literal') return true
  return node.type === 'TemplateLiteral' && node.expressions.length === 0
}

function isStaticObjectExpression(node) {
  if (node?.type !== 'ObjectExpression') return false

  return node.properties.every((property) => {
    if (property.type !== 'Property') return false
    if (property.computed) return false
    return isLiteralLike(property.value)
  })
}

function isStaticI18nCall(node, calleeNames) {
  const calleeName = getStaticCallCalleeName(node)
  if (!calleeName || !calleeNames.has(calleeName)) return false

  const [keyArgument, paramsArgument] = node.arguments
  if (!isStringLiteral(keyArgument)) return false
  if (!paramsArgument) return true

  return isStaticObjectExpression(paramsArgument)
}

function isSimpleClassKey(node) {
  if (!node) return false
  if (node.type === 'Identifier') return true
  return isLiteralLike(node)
}

function isSimpleTemplateClassExpression(node) {
  if (!node) return false

  if (node.type === 'Literal' || node.type === 'Identifier' || node.type === 'ThisExpression') return true

  if (node.type === 'ChainExpression') return isSimpleTemplateClassExpression(node.expression)

  if (node.type === 'MemberExpression') {
    if (node.computed && !isLiteralLike(node.property)) return false
    return isSimpleTemplateClassExpression(node.object)
  }

  if (node.type === 'UnaryExpression') return isSimpleTemplateClassExpression(node.argument)

  if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
    return isSimpleTemplateClassExpression(node.left) && isSimpleTemplateClassExpression(node.right)
  }

  return false
}

function isSimpleTemplateClassObject(node) {
  if (node?.type !== 'ObjectExpression') return false
  if (!node.properties.length) return false

  return node.properties.every((property) => {
    if (property.type !== 'Property') return false
    if (!isSimpleClassKey(property.key)) return false
    if (property.computed) return false
    return isSimpleTemplateClassExpression(property.value)
  })
}

function isClassMapVariableName(name, classMapVariableNames) {
  if (!name) return false
  if (classMapVariableNames.has(name)) return true

  return /(?:^|[A-Z])(root)?Classes?$|ClassMap$/u.test(name)
}

function resolveOptions(options) {
  const option = options[0] ?? {}

  return {
    i18nFunctionNames: resolveOptionSet(option.i18nFunctionNames, ['t', 'translateLegacy', '$t']),
    classMapVariableNames: resolveOptionSet(option.classMapVariableNames, ['rootClass', 'rootClasses', 'classMap', 'classNames']),
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示不要用 computed 只包一层静态 i18n 调用或简单模板 class map。',
    },
    messages: {
      preferInlineTrivialComputed:
        '这个 computed 只是静态 i18n 调用的薄包装，没有额外派生逻辑；请在模板或调用处直接内联 {{expression}}，减少没有语义的中间变量。',
      preferInlineTrivialClassComputed:
        '这个 computed 只是简单模板 class map，没有跨节点复用或复杂派生；请直接写在 template 的 :class 里，让状态和 DOM 更容易对照。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          i18nFunctionNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: ['t', 'translateLegacy', '$t'],
          },
          classMapVariableNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: ['rootClass', 'rootClasses', 'classMap', 'classNames'],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { classMapVariableNames, i18nFunctionNames } = resolveOptions(context.options)

    function reportIfTrivialComputed(node) {
      if (!isComputedCall(node.init)) return

      const expression = getComputedGetterExpression(node.init)
      if (isStaticI18nCall(expression, i18nFunctionNames)) {
        context.report({
          node,
          messageId: 'preferInlineTrivialComputed',
          data: {
            expression: context.sourceCode.getText(expression),
          },
        })
        return
      }

      const variableName = node.id?.type === 'Identifier' ? node.id.name : ''
      if (!isClassMapVariableName(variableName, classMapVariableNames) || !isSimpleTemplateClassObject(expression)) return

      context.report({
        node,
        messageId: 'preferInlineTrivialClassComputed',
      })
    }

    return {
      VariableDeclarator: reportIfTrivialComputed,
    }
  },
}
