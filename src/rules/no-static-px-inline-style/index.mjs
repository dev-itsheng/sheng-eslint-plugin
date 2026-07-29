import path from 'node:path'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'

const STATIC_PX_PATTERN = /(^|[^\w-])-?\d*\.?\d+px\b/

function toPosixPath(value) {
  return String(value).replaceAll(path.sep, '/')
}

function normalizeFilename(filename, cwd) {
  const absoluteFilename = path.isAbsolute(filename) ? filename : path.resolve(cwd, filename)
  return toPosixPath(path.relative(cwd, absoluteFilename))
}

function matchesIgnoredPath(filename, ignoredPathPatterns) {
  return ignoredPathPatterns.some((pattern) => new RegExp(pattern).test(filename))
}

function resolveOptions(options) {
  const option = options[0] ?? {}

  return {
    ignoredPathPatterns: Array.isArray(option.ignoredPathPatterns) ? option.ignoredPathPatterns : [],
  }
}

function getDirectiveName(attribute) {
  return attribute?.key?.name?.name ?? null
}

function getDirectiveArgumentName(attribute) {
  const argument = attribute?.key?.argument
  if (!argument) return null
  if (argument.type === 'VIdentifier') return argument.name
  if (argument.type === 'VExpressionContainer') return argument.expression?.name ?? null

  return null
}

function isStyleBinding(attribute) {
  if (!attribute?.directive) return false
  const name = getDirectiveName(attribute)
  if (name !== 'bind') return false

  return getDirectiveArgumentName(attribute) === 'style'
}

function unwrapExpression(node) {
  return node?.type === 'ChainExpression' ? node.expression : node
}

function isStaticPxText(value) {
  return typeof value === 'string' && STATIC_PX_PATTERN.test(value)
}

function nodeHasStaticPxLiteral(node) {
  const value = unwrapExpression(node)
  if (!value) return false

  switch (value.type) {
    case 'Literal':
      return isStaticPxText(value.value)
    case 'TemplateLiteral':
      return value.quasis.some((quasi) => isStaticPxText(quasi.value.raw) || isStaticPxText(quasi.value.cooked))
    case 'ConditionalExpression':
      return nodeHasStaticPxLiteral(value.consequent) || nodeHasStaticPxLiteral(value.alternate)
    case 'LogicalExpression':
      return nodeHasStaticPxLiteral(value.left) || nodeHasStaticPxLiteral(value.right)
    default:
      return false
  }
}

function objectHasStaticPxValue(node) {
  const objectExpression = unwrapExpression(node)
  if (objectExpression?.type !== 'ObjectExpression') return false

  return objectExpression.properties.some((property) => {
    if (property.type !== 'Property') return false
    if (property.computed) return false

    return nodeHasStaticPxLiteral(property.value)
  })
}

function collectStyleBindingIdentifiers(expression, identifiers) {
  const node = unwrapExpression(expression)
  if (!node) return

  switch (node.type) {
    case 'Identifier':
      identifiers.push(node)
      break
    case 'ArrayExpression':
      for (const element of node.elements) {
        collectStyleBindingIdentifiers(element, identifiers)
      }
      break
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示 Vue 组件不要把固定 px 样式写成 :style 绑定对象。',
    },
    messages: {
      staticPxInlineStyle: '固定 px 样式不要写在 :style 的 JS 对象里；静态尺寸请放到 BEM 选择器，并优先用 TailwindCSS @apply（如 size-6 / h-11 / gap-1 / rounded-*）。确实动态的尺寸再使用 CSS 变量或 CSS v-bind。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoredPathPatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const compatibleContext = createRuleContextCompat(context, 'no-static-px-inline-style', { requireSourceCode: true })
    const cwd = compatibleContext.cwd
    const filename = normalizeFilename(compatibleContext.filename, cwd)
    const { ignoredPathPatterns } = resolveOptions(compatibleContext.options)

    if (matchesIgnoredPath(filename, ignoredPathPatterns)) return {}

    const styleBindingIdentifierNames = new Set()
    const staticPxObjectDeclarations = new Map()

    function reportIfUsedStaticStyleObject(name, node) {
      if (!styleBindingIdentifierNames.has(name)) return

      compatibleContext.report({
        node,
        messageId: 'staticPxInlineStyle',
      })
    }

    const scriptVisitor = {
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier') return
        if (!objectHasStaticPxValue(node.init)) return

        staticPxObjectDeclarations.set(node.id.name, node.init)
        reportIfUsedStaticStyleObject(node.id.name, node.init)
      },
      'Program:exit'() {
        for (const [name, node] of staticPxObjectDeclarations) {
          reportIfUsedStaticStyleObject(name, node)
        }
      },
    }

    const templateVisitor = {
      VAttribute(node) {
        if (!isStyleBinding(node)) return

        const expression = node.value?.expression
        if (!expression) return

        if (objectHasStaticPxValue(expression)) {
          compatibleContext.report({
            node: expression,
            messageId: 'staticPxInlineStyle',
          })
          return
        }

        const identifiers = []
        collectStyleBindingIdentifiers(expression, identifiers)
        for (const identifier of identifiers) {
          styleBindingIdentifierNames.add(identifier.name)
        }

        for (const identifier of identifiers) {
          const declaration = staticPxObjectDeclarations.get(identifier.name)
          if (!declaration) continue

          compatibleContext.report({
            node: identifier,
            messageId: 'staticPxInlineStyle',
          })
        }
      },
    }

    return compatibleContext.parserServices?.defineTemplateBodyVisitor?.(templateVisitor, scriptVisitor) ?? scriptVisitor
  },
}
