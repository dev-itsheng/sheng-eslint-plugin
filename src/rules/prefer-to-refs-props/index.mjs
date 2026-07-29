function unwrapExpression(node) {
  if (['ChainExpression', 'TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression'].includes(node?.type)) {
    return unwrapExpression(node.expression)
  }

  return node
}

function isPropsIdentifier(node) {
  const unwrapped = unwrapExpression(node)
  return unwrapped?.type === 'Identifier' && unwrapped.name === 'props'
}

function isToRefCall(node) {
  const callee = unwrapExpression(node.callee)
  if (callee?.type === 'Identifier') return callee.name === 'toRef'
  return callee?.type === 'MemberExpression' && callee.property?.type === 'Identifier' && callee.property.name === 'toRef'
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提醒组件脚本里不要直接读取 props.xxx 或 toRef(props, key)，统一先 toRefs(props)。',
    },
    messages: {
      noPropsMember: '组件脚本里不要直接读取 props.{{name}}；先 const { {{name}} } = toRefs(props)，再使用对应 Ref，避免后续传给 composable 时丢响应式。',
      noToRefProps: '不要使用 toRef(props, key)；本项目统一使用 const { key } = toRefs(props)，让 props 响应式入口保持一致。',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (!isPropsIdentifier(node.object)) return

        const propertyName = node.property?.type === 'Identifier' ? node.property.name : 'xxx'
        context.report({
          node,
          messageId: 'noPropsMember',
          data: {
            name: propertyName,
          },
        })
      },
      CallExpression(node) {
        if (!isToRefCall(node)) return
        if (!isPropsIdentifier(node.arguments[0])) return

        context.report({
          node,
          messageId: 'noToRefProps',
        })
      },
    }
  },
}
