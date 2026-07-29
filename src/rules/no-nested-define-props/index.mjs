const TRANSPARENT_EXPRESSION_TYPES = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSInstantiationExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
])

function isLikelyVueFile(context) {
  return context.filename?.endsWith('.vue') || context.getFilename?.().endsWith('.vue')
}

function hasScriptSetup(sourceCode) {
  return /<script\b[^>]*\bsetup\b/i.test(sourceCode.text)
}

function isIdentifierCallee(node, name) {
  return node?.type === 'Identifier' && node.name === name
}

function isCallOf(node, name) {
  return node?.type === 'CallExpression' && isIdentifierCallee(node.callee, name)
}

function isTransparentExpression(node, child) {
  if (!node || !TRANSPARENT_EXPRESSION_TYPES.has(node.type)) return false
  return node.expression === child
}

function skipTransparentParents(node) {
  let current = node

  while (isTransparentExpression(current.parent, current)) {
    current = current.parent
  }

  return current
}

function isProgramChild(node) {
  return node?.parent?.type === 'Program'
}

function isTopLevelVariableInit(node) {
  return (
    node.parent?.type === 'VariableDeclarator' &&
    node.parent.init === node &&
    node.parent.parent?.type === 'VariableDeclaration' &&
    isProgramChild(node.parent.parent)
  )
}

function isTopLevelExpressionStatement(node) {
  return node.parent?.type === 'ExpressionStatement' && node.parent.expression === node && isProgramChild(node.parent)
}

function isTopLevelCompilerMacroEntry(node) {
  const expression = skipTransparentParents(node)
  return isTopLevelVariableInit(expression) || isTopLevelExpressionStatement(expression)
}

function isFirstArgumentOfWithDefaults(node) {
  const expression = skipTransparentParents(node)
  const parent = expression.parent

  return isCallOf(parent, 'withDefaults') && parent.arguments[0] === expression
}

function isAllowedDefinePropsEntry(node) {
  if (isTopLevelCompilerMacroEntry(node)) return true

  if (isFirstArgumentOfWithDefaults(node)) {
    const withDefaultsCall = skipTransparentParents(skipTransparentParents(node).parent)
    return isTopLevelCompilerMacroEntry(withDefaultsCall)
  }

  return false
}

function getCalleeText(sourceCode, node) {
  if (node.callee.type === 'Identifier') return `${node.callee.name}(...)`
  if (node.callee.type === 'MemberExpression') return `${sourceCode.getText(node.callee)}(...)`

  return '运行时函数'
}

function getWrapperText(sourceCode, node) {
  const expression = skipTransparentParents(node)
  const parent = expression.parent

  if (parent?.type === 'CallExpression' && parent.arguments.includes(expression)) {
    return getCalleeText(sourceCode, parent)
  }

  if (parent?.type === 'ArrayExpression') return '数组字面量'
  if (parent?.type === 'ObjectProperty' || parent?.type === 'Property') return '对象字面量'
  if (parent?.type === 'ConditionalExpression') return '条件表达式'
  if (parent?.type === 'LogicalExpression') return '逻辑表达式'

  return '普通表达式'
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '避免把 Vue <script setup> 的 defineProps() 包进普通运行时表达式，导致编译器宏没有被识别。',
    },
    messages: {
      nestedDefineProps:
        'defineProps() 必须作为 <script setup> 顶层宏入口使用；当前它被 {{wrapper}} 包住，Vue 编译器不会把它当成 props 声明。请先声明 props，再把 props 交给运行时函数。',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    if (!isLikelyVueFile(context) || !hasScriptSetup(sourceCode)) return {}

    return {
      CallExpression(node) {
        if (!isIdentifierCallee(node.callee, 'defineProps')) return
        if (isAllowedDefinePropsEntry(node)) return

        context.report({
          node: node.callee,
          messageId: 'nestedDefineProps',
          data: {
            wrapper: getWrapperText(sourceCode, node),
          },
        })
      },
    }
  },
}
