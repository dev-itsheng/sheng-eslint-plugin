export const DEFAULT_I18N_FUNCTION_NAMES = ['t', '$t']

export function getPropertyName(property) {
  if (!property) return null
  if (property.type === 'Identifier') return property.name
  if (property.type === 'Literal') return String(property.value)
  return null
}

export function getCalleeName(callee) {
  if (callee.type === 'Identifier') return callee.name
  if (callee.type === 'MemberExpression' && !callee.computed) return getPropertyName(callee.property)
  if (callee.type === 'MemberExpression' && callee.computed && callee.property.type === 'Literal') return getPropertyName(callee.property)
  return null
}

export function getObjectPropertyKeyName(property) {
  if (property.type !== 'Property') return null
  if (property.computed) return property.key.type === 'Literal' ? String(property.key.value) : null
  return getPropertyName(property.key)
}

function isUseAppI18nCall(node) {
  return node?.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'useAppI18n'
}

export function createI18nCallTracker(context, defaultFunctionNames = DEFAULT_I18N_FUNCTION_NAMES) {
  const options = context.options[0] ?? {}
  const functionNames = new Set(options.functionNames ?? defaultFunctionNames)

  function rememberUseAppI18nAlias(node) {
    if (node.id.type === 'ObjectPattern' && isUseAppI18nCall(node.init)) {
      for (const property of node.id.properties) {
        if (property.type !== 'Property') continue
        if (getObjectPropertyKeyName(property) !== 't') continue
        if (property.value.type === 'Identifier') functionNames.add(property.value.name)
      }
      return
    }

    if (node.id.type === 'Identifier' && node.init?.type === 'MemberExpression' && getCalleeName(node.init) === 't' && isUseAppI18nCall(node.init.object)) {
      functionNames.add(node.id.name)
    }
  }

  function getI18nCalleeName(callee) {
    const name = getCalleeName(callee)
    return name && functionNames.has(name) ? name : null
  }

  return {
    getI18nCalleeName,
    rememberUseAppI18nAlias,
  }
}

export function defineTemplateAwareVisitor(context, visitor) {
  const parserServices = context.sourceCode?.parserServices ?? context.parserServices
  if (parserServices?.defineTemplateBodyVisitor) {
    return parserServices.defineTemplateBodyVisitor(visitor, visitor)
  }

  return visitor
}
