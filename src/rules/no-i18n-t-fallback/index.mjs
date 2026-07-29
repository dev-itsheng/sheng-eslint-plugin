import { createI18nCallTracker, defineTemplateAwareVisitor, getObjectPropertyKeyName } from '../utils/i18n-call.mjs'

const DEFAULT_NO_FALLBACK_FUNCTION_NAMES = ['t', '$t', 'translateLegacy']

function findFallbackProperty(node) {
  if (node.type !== 'ObjectExpression') return null
  return node.properties.find((property) => getObjectPropertyKeyName(property) === 'fallback') ?? null
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在 i18n 翻译函数调用里传 fallback，避免缺失 key 被调用点静默掩盖。',
    },
    messages: {
      noFallback: '不要在 {{name}}() 里传 fallback；缺失 key 应该暴露给 i18n 流程，或直接使用已有真实文案/已有 key。',
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
    const { getI18nCalleeName, rememberUseAppI18nAlias } = createI18nCallTracker(context, DEFAULT_NO_FALLBACK_FUNCTION_NAMES)

    function checkCallExpression(node) {
      const name = getI18nCalleeName(node.callee)
      if (!name) return

      for (const argument of node.arguments) {
        const fallbackProperty = findFallbackProperty(argument)
        if (!fallbackProperty) continue

        context.report({
          node: fallbackProperty,
          messageId: 'noFallback',
          data: { name },
        })
      }
    }

    const visitor = {
      VariableDeclarator: rememberUseAppI18nAlias,
      CallExpression: checkCallExpression,
    }

    return defineTemplateAwareVisitor(context, visitor)
  },
}
