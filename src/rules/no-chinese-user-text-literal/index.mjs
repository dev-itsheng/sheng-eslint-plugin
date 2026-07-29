import { defineTemplateAwareVisitor } from '../utils/i18n-call.mjs'

const HAN_TEXT_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u

function hasChineseText(value) {
  return typeof value === 'string' && HAN_TEXT_PATTERN.test(value)
}

function isStaticImportOrExportSource(node, ancestors) {
  const parent = ancestors.at(-1)
  return (
    node.type === 'Literal' &&
    typeof node.value === 'string' &&
    (parent?.type === 'ImportDeclaration' || parent?.type === 'ExportNamedDeclaration' || parent?.type === 'ExportAllDeclaration') &&
    parent.source === node
  )
}

function isTypeOnlyLiteral(ancestors) {
  return ancestors.some((ancestor) => {
    return (
      ancestor.type === 'TSLiteralType' ||
      ancestor.type === 'TSTypeReference' ||
      ancestor.type === 'TSUnionType' ||
      ancestor.type === 'TSIntersectionType' ||
      ancestor.type === 'TSTypeAliasDeclaration' ||
      ancestor.type === 'TSInterfaceDeclaration'
    )
  })
}

function normalizeTemplateText(value) {
  return String(value).replace(/\s+/g, ' ').trim()
}

function getLiteralValue(node) {
  if (node.type === 'Literal') return typeof node.value === 'string' ? node.value : null
  if (node.type === 'VLiteral') return typeof node.value === 'string' ? node.value : null
  return null
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '扫描运行时代码里的中文字面量；用户可见中文应使用已有 i18n key，待补文案进入项目文案清单。',
    },
    messages: {
      chineseLiteral: '运行时代码里不要直接写中文字面量；如果这是用户可见文案，请改用 i18n key，或先登记到项目文案清单。',
      chineseTemplateText: 'Vue template 里不要直接写中文文本；如果这是用户可见文案，请改用 i18n key，或先登记到项目文案清单。',
    },
    schema: [],
  },
  create(context) {
    function checkLiteral(node) {
      const ancestors = context.sourceCode.getAncestors?.(node) ?? []
      if (isStaticImportOrExportSource(node, ancestors)) return
      if (isTypeOnlyLiteral(ancestors)) return

      const value = getLiteralValue(node)
      if (!hasChineseText(value)) return

      context.report({
        node,
        messageId: 'chineseLiteral',
      })
    }

    function checkTemplateText(node) {
      const text = normalizeTemplateText(node.value ?? node.raw ?? '')
      if (!hasChineseText(text)) return

      context.report({
        node,
        messageId: 'chineseTemplateText',
      })
    }

    const visitor = {
      Literal: checkLiteral,
      TemplateLiteral(node) {
        const text = node.quasis.map((quasi) => quasi.value.raw).join('${}')
        if (!hasChineseText(text)) return

        context.report({
          node,
          messageId: 'chineseLiteral',
        })
      },
      VLiteral: checkLiteral,
      VText: checkTemplateText,
    }

    return defineTemplateAwareVisitor(context, visitor)
  },
}
