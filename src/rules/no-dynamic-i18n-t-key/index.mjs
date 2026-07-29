import { createI18nCallTracker, defineTemplateAwareVisitor } from '../utils/i18n-call.mjs'

function isStringLiteral(node) {
  return node?.type === 'Literal' && typeof node.value === 'string'
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '要求 i18n 的 t() 第一个参数必须是字符串字面量，保证 IDE 插件和静态扫描能识别真实 key。',
    },
    messages: {
      literalKey: "{{name}}() 的第一个参数必须是字符串字面量，例如 t('string_save')；动态 key 会让 IDE i18n 插件和静态扫描失效。",
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          functionNames: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
  },
  create(context) {
    const { getI18nCalleeName, rememberUseAppI18nAlias } = createI18nCallTracker(context)

    function checkCallExpression(node) {
      const name = getI18nCalleeName(node.callee)
      if (!name) return

      const keyArgument = node.arguments[0]
      if (isStringLiteral(keyArgument)) return

      context.report({
        node: keyArgument ?? node.callee,
        messageId: 'literalKey',
        data: { name },
      })
    }

    const visitor = {
      VariableDeclarator: rememberUseAppI18nAlias,
      CallExpression: checkCallExpression,
    }

    return defineTemplateAwareVisitor(context, visitor)
  },
}
