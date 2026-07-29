import ts from 'typescript'
import {
  DEFAULT_STRING_LENGTH_ALTERNATIVE,
  DEFAULT_TECHNICAL_NAME_PATTERN_FRAGMENTS,
  DEFAULT_TECHNICAL_NAME_WORDS,
  DEFAULT_USER_TEXT_NAME_PHRASES,
  DEFAULT_USER_TEXT_NAME_WORDS,
  MAXLENGTH_SAFE_INPUT_TYPE_NAMES,
  NATIVE_STRING_TEXT_METHOD_NAMES,
  STRING_ONLY_RETURNING_METHOD_NAMES,
  STRING_REF_CREATOR_NAMES,
  STRING_RETURNING_METHOD_ALTERNATIVE_ENTRIES,
} from './constants.js'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'

const STRING_RETURNING_METHOD_ALTERNATIVES = new Map(STRING_RETURNING_METHOD_ALTERNATIVE_ENTRIES)
const STRING_REF_CREATORS = new Set(STRING_REF_CREATOR_NAMES)
const NATIVE_STRING_TEXT_METHODS = new Set(NATIVE_STRING_TEXT_METHOD_NAMES)
const STRING_ONLY_RETURNING_METHODS = new Set(STRING_ONLY_RETURNING_METHOD_NAMES)
const MAXLENGTH_SAFE_INPUT_TYPES = new Set(MAXLENGTH_SAFE_INPUT_TYPE_NAMES)

function getPropertyName(property) {
  if (!property) return null
  if (property.type === 'Identifier') return property.name
  if (property.type === 'Literal') return String(property.value)
  return null
}

function getMemberPropertyName(node) {
  if (node.type !== 'MemberExpression') return null
  if (!node.computed) return getPropertyName(node.property)
  return node.property.type === 'Literal' ? getPropertyName(node.property) : null
}

function addSemanticName(names, name) {
  if (!name) return
  names.add(String(name))
}

function normalizeSemanticName(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

function compilePatterns(patterns) {
  return patterns.map((pattern) => new RegExp(pattern, 'i'))
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toWordPattern(words, patternFragments = []) {
  const parts = [...words.map(escapeRegExp), ...patternFragments]
  return parts.length ? `\\b(?:${parts.join('|')})\\b` : null
}

function toPhrasePattern(phrase) {
  return `\\b${String(phrase).trim().split(/\s+/).map(escapeRegExp).join('\\s+')}\\b`
}

const defaultTechnicalNamePatterns = [toWordPattern(DEFAULT_TECHNICAL_NAME_WORDS, DEFAULT_TECHNICAL_NAME_PATTERN_FRAGMENTS)].filter(Boolean)

const defaultUserTextNamePatterns = [toWordPattern(DEFAULT_USER_TEXT_NAME_WORDS), ...DEFAULT_USER_TEXT_NAME_PHRASES.map(toPhrasePattern)].filter(Boolean)

function resolveOptions(context) {
  const options = context.options[0] ?? {}
  return {
    technicalNamePatterns: compilePatterns([...defaultTechnicalNamePatterns, ...(Array.isArray(options.technicalNamePatterns) ? options.technicalNamePatterns : [])]),
    userTextNamePatterns: compilePatterns([...defaultUserTextNamePatterns, ...(Array.isArray(options.userTextNamePatterns) ? options.userTextNamePatterns : [])]),
  }
}

function semanticNamesText(names) {
  return [...names].map(normalizeSemanticName).filter(Boolean).join(' ')
}

function matchesAnyPattern(names, patterns) {
  const text = semanticNamesText(names)
  return Boolean(text && patterns.some((pattern) => pattern.test(text)))
}

function unwrapExpression(node) {
  if (node.type === 'ChainExpression') return unwrapExpression(node.expression)
  if (node.type === 'TSAsExpression' || node.type === 'TSTypeAssertion' || node.type === 'TSNonNullExpression') return unwrapExpression(node.expression)
  return node
}

function getCallExpressionName(node) {
  if (node.callee.type === 'Identifier') return node.callee.name
  if (node.callee.type === 'MemberExpression') return getMemberPropertyName(node.callee)
  return null
}

function getTypeParameters(node) {
  return node.typeParameters?.params ?? node.typeArguments?.params ?? []
}

function typeNodeIncludesString(node) {
  if (!node) return false

  const typeNode = node.typeAnnotation ?? node
  if (typeNode.type === 'TSStringKeyword') return true
  if (typeNode.type === 'TSLiteralType') return typeof typeNode.literal.value === 'string'
  if (typeNode.type === 'TSUnionType') return typeNode.types.some(typeNodeIncludesString)

  return false
}

function getTypeScriptServices(context) {
  const parserServices = context.sourceCode?.parserServices ?? context.parserServices
  if (!parserServices?.program || !parserServices.esTreeNodeToTSNodeMap) return null

  return {
    checker: parserServices.program.getTypeChecker(),
    esTreeNodeToTSNodeMap: parserServices.esTreeNodeToTSNodeMap,
  }
}

function typeIncludesString(checker, type) {
  if (!type) return false
  if (type.isUnion()) return type.types.some((item) => typeIncludesString(checker, item))

  const flags = type.getFlags()
  if (flags & ts.TypeFlags.StringLike) return true

  const apparentType = checker.getApparentType(type)
  return apparentType !== type && Boolean(apparentType.getFlags() & ts.TypeFlags.StringLike)
}

function isStringByTypeServices(node, services) {
  if (!services) return null

  const tsNode = services.esTreeNodeToTSNodeMap.get(node)
  if (!tsNode) return null

  return typeIncludesString(services.checker, services.checker.getTypeAtLocation(tsNode))
}

function isKnownStringExpression(context, node) {
  const expression = unwrapExpression(node)

  if (expression.type === 'Literal') return typeof expression.value === 'string'
  if (expression.type === 'TemplateLiteral') return true

  if (expression.type === 'CallExpression') {
    if (expression.callee.type === 'Identifier' && expression.callee.name === 'String') return true

    if (expression.callee.type === 'MemberExpression') {
      const methodName = getMemberPropertyName(expression.callee)
      if (methodName && STRING_RETURNING_METHOD_ALTERNATIVES.has(methodName)) {
        if (STRING_ONLY_RETURNING_METHODS.has(methodName)) return true
        const receiver = unwrapExpression(expression.callee.object)
        return isKnownStringExpression(context, receiver) || isIdentifierKnownString(context, receiver) || isVueRefValueKnownString(context, receiver)
      }
    }
  }

  return false
}

function getLengthAlternative(context, node) {
  const expression = unwrapExpression(node)

  if (expression.type === 'CallExpression' && expression.callee.type === 'MemberExpression') {
    const methodName = getMemberPropertyName(expression.callee)
    return (methodName && STRING_RETURNING_METHOD_ALTERNATIVES.get(methodName)) || DEFAULT_STRING_LENGTH_ALTERNATIVE
  }

  const sourceText = context.sourceCode.getText(node)
  return `统计长度使用 countUnicodeCharacters(${sourceText})；判空使用 isUnicodeTextBlank(${sourceText})；超限使用 isUnicodeTextOverLimit(${sourceText}, max)`
}

function findVariable(context, identifier) {
  let scope = context.sourceCode.getScope(identifier)
  while (scope) {
    const variable = scope.variables.find((item) => item.name === identifier.name)
    if (variable) return variable
    scope = scope.upper
  }
  return null
}

function collectVariableInitSemanticNames(context, identifier, names, seen) {
  const variable = findVariable(context, identifier)
  if (!variable || seen.has(variable)) return

  seen.add(variable)
  for (const definition of variable.defs) {
    if (definition.type === 'Variable' && definition.node.init) {
      collectSemanticNames(context, definition.node.init, names, seen)
    }
  }
}

function collectSemanticNames(context, node, names = new Set(), seen = new Set()) {
  if (!node) return names

  const expression = unwrapExpression(node)
  switch (expression.type) {
    case 'Identifier':
      addSemanticName(names, expression.name)
      collectVariableInitSemanticNames(context, expression, names, seen)
      break
    case 'MemberExpression':
      collectSemanticNames(context, expression.object, names, seen)
      addSemanticName(names, getMemberPropertyName(expression))
      if (expression.computed) collectSemanticNames(context, expression.property, names, seen)
      break
    case 'CallExpression':
      collectSemanticNames(context, expression.callee, names, seen)
      for (const argument of expression.arguments) collectSemanticNames(context, argument, names, seen)
      break
    case 'TemplateLiteral':
      for (const item of expression.expressions) collectSemanticNames(context, item, names, seen)
      break
    case 'BinaryExpression':
    case 'LogicalExpression':
      collectSemanticNames(context, expression.left, names, seen)
      collectSemanticNames(context, expression.right, names, seen)
      break
    case 'ConditionalExpression':
      collectSemanticNames(context, expression.test, names, seen)
      collectSemanticNames(context, expression.consequent, names, seen)
      collectSemanticNames(context, expression.alternate, names, seen)
      break
    case 'ArrayExpression':
      for (const item of expression.elements) collectSemanticNames(context, item, names, seen)
      break
    case 'ObjectExpression':
      for (const property of expression.properties) {
        if (property.type !== 'Property') continue
        collectSemanticNames(context, property.key, names, seen)
        collectSemanticNames(context, property.value, names, seen)
      }
      break
    default:
      break
  }

  return names
}

function collectEnclosingFunctionSemanticNames(context, node, names) {
  const ancestors = context.sourceCode.getAncestors?.(node) ?? []
  for (const ancestor of ancestors) {
    if (ancestor.type === 'FunctionDeclaration') {
      addSemanticName(names, ancestor.id?.name)
      continue
    }

    if (ancestor.type === 'VariableDeclarator' && ancestor.init && /FunctionExpression|ArrowFunctionExpression/.test(ancestor.init.type)) {
      addSemanticName(names, ancestor.id.type === 'Identifier' ? ancestor.id.name : null)
      continue
    }

    if (ancestor.type === 'MethodDefinition' || ancestor.type === 'Property') {
      addSemanticName(names, getPropertyName(ancestor.key))
    }
  }
}

function isStringVariable(context, variable) {
  return variable.defs.some((definition) => {
    if (definition.type === 'Variable' && definition.node.id.type === 'Identifier') {
      return typeNodeIncludesString(definition.node.id.typeAnnotation) || Boolean(definition.node.init && isKnownStringExpression(context, definition.node.init))
    }

    if (definition.type === 'Parameter' && definition.name.type === 'Identifier') {
      return typeNodeIncludesString(definition.name.typeAnnotation)
    }

    return false
  })
}

function isStringRefVariable(context, variable) {
  return variable.defs.some((definition) => {
    if (definition.type !== 'Variable' || definition.node.init?.type !== 'CallExpression') return false

    const callName = getCallExpressionName(definition.node.init)
    if (!callName || !STRING_REF_CREATORS.has(callName)) return false

    return getTypeParameters(definition.node.init).some(typeNodeIncludesString) || definition.node.init.arguments.some((argument) => isKnownStringExpression(context, argument))
  })
}

function isIdentifierKnownString(context, node) {
  if (node.type !== 'Identifier') return false

  const variable = findVariable(context, node)
  return Boolean(variable && isStringVariable(context, variable))
}

function isVueRefValueKnownString(context, node) {
  if (node.type !== 'MemberExpression' || getMemberPropertyName(node) !== 'value') return false

  const refObject = unwrapExpression(node.object)
  if (refObject.type !== 'Identifier') return false

  const variable = findVariable(context, refObject)
  return Boolean(variable && isStringRefVariable(context, variable))
}

function isUserTextStringExpression(context, node, typeScriptServices) {
  const target = unwrapExpression(node)
  const isString = isStringByTypeServices(target, typeScriptServices)
  if (isString === false) return false
  if (isString === true) return true

  return isKnownStringExpression(context, target) || isIdentifierKnownString(context, target) || isVueRefValueKnownString(context, target)
}

function shouldReportUserTextOperation(context, target, operationNode, typeScriptServices, options) {
  if (!isUserTextStringExpression(context, target, typeScriptServices)) return false

  const expression = unwrapExpression(target)
  if (expression.type === 'Literal' || expression.type === 'TemplateLiteral') return true

  const names = collectSemanticNames(context, target)
  if (operationNode?.type === 'CallExpression') {
    for (const argument of operationNode.arguments) collectSemanticNames(context, argument, names)
  }
  collectEnclosingFunctionSemanticNames(context, operationNode ?? target, names)

  if (matchesAnyPattern(names, options.userTextNamePatterns)) return true
  return !matchesAnyPattern(names, options.technicalNamePatterns)
}

function getCallArgumentText(context, node, index, fallback = '') {
  const argument = node.arguments[index]
  return argument ? context.sourceCode.getText(argument) : fallback
}

function isZeroLiteral(node) {
  return node?.type === 'Literal' && node.value === 0
}

function isNegativeLiteral(node) {
  return node?.type === 'Literal' && typeof node.value === 'number' && node.value < 0
}

function getNativeStringMethodAlternative(context, node, methodName, target) {
  const sourceText = context.sourceCode.getText(target)
  if (methodName === 'charAt') {
    return `按用户感知字符取单个字符，使用 getUnicodeCharacterAt(${sourceText}, ${getCallArgumentText(context, node, 0, 'index')})`
  }

  if (methodName === 'slice') {
    const start = node.arguments[0]
    const end = node.arguments[1]
    if (isZeroLiteral(start) && end && !isNegativeLiteral(end)) {
      return `只限制最大长度时使用 truncateUnicodeCharacters(${sourceText}, ${context.sourceCode.getText(end)})；需要保留 slice 语义时使用 sliceUnicodeCharacters(${sourceText}, ${getCallArgumentText(context, node, 0, 'start')}, ${getCallArgumentText(context, node, 1, 'end')})`
    }
    return `按用户感知字符切片，使用 sliceUnicodeCharacters(${sourceText}, ${getCallArgumentText(context, node, 0, 'start')}, ${getCallArgumentText(context, node, 1, 'end')})`
  }

  if (methodName === 'substring') {
    return `按用户感知字符截取，使用 substringUnicodeCharacters(${sourceText}, ${getCallArgumentText(context, node, 0, 'start')}, ${getCallArgumentText(context, node, 1, 'end')})`
  }

  if (methodName === 'substr') {
    return `substr 是遗留 API；按用户感知字符切片请改用 sliceUnicodeCharacters(${sourceText}, start, end)，只限制最大长度时使用 truncateUnicodeCharacters(${sourceText}, max)`
  }

  return DEFAULT_STRING_LENGTH_ALTERNATIVE
}

function getVueAttributeName(node) {
  const key = node.key
  if (!key) return null
  if (key.type === 'VIdentifier') return key.name
  if (key.type === 'VDirectiveKey') return key.argument?.type === 'VIdentifier' ? key.argument.name : key.name?.name
  return null
}

function getStaticVueAttributeValue(attribute) {
  return attribute?.value?.type === 'VLiteral' && typeof attribute.value.value === 'string' ? attribute.value.value : null
}

function getVueStartTag(node) {
  return node.parent?.type === 'VStartTag' ? node.parent : null
}

function getVueElementName(node) {
  const startTag = getVueStartTag(node)
  const element = startTag?.parent
  return element?.type === 'VElement' ? element.rawName?.toLowerCase() : null
}

function findStaticVueAttribute(node, name) {
  const startTag = getVueStartTag(node)
  return startTag?.attributes.find((attribute) => !attribute.directive && getVueAttributeName(attribute) === name) ?? null
}

function collectVueAttributeSemanticNames(context, attribute, names, { includeAttributeName = true, includeStaticValue = true } = {}) {
  if (includeAttributeName) addSemanticName(names, getVueAttributeName(attribute))

  if (attribute.directive) {
    const expression = attribute.value?.expression
    if (expression) collectSemanticNames(context, expression, names)
    return
  }

  const value = getStaticVueAttributeValue(attribute)
  if (includeStaticValue && value) addSemanticName(names, value)
}

function shouldReportVueMaxlength(context, node, options) {
  const userTextNames = new Set()
  const technicalNames = new Set()
  const startTag = getVueStartTag(node)
  for (const attribute of startTag?.attributes ?? []) {
    const name = getVueAttributeName(attribute)
    collectVueAttributeSemanticNames(context, attribute, technicalNames)
    collectVueAttributeSemanticNames(context, attribute, userTextNames, {
      // class/style 里经常有 Tailwind 的 `text-*`、`content-*` 等工具类。
      // 它们可以帮助识别 password/code 这类技术输入，但不能当作“用户文案”
      // 的正向证据，否则密码框会因为 `text-ink-primary` 被误报。
      includeAttributeName: false,
      includeStaticValue: name !== 'class' && name !== 'style',
    })
  }

  if (matchesAnyPattern(userTextNames, options.userTextNamePatterns)) return true
  return !matchesAnyPattern(technicalNames, options.technicalNamePatterns)
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在用户可见文本里直接使用原生字符串长度 / 截断 API，避免 UTF-16 code unit 计数和切片误伤 emoji、国旗和组合字符。',
    },
    messages: {
      noStringLength: '不要直接读取字符串 .length；{{alternative}}。协议、字节、手机号等确需原生长度时，请局部禁用本规则并写明理由。',
      noNativeStringMethod:
        '不要在用户可见文本上直接调用 String.prototype.{{methodName}}；{{alternative}}。协议、字节、手机号、路径、随机 ID 等技术字符串确需原生切片时，请局部禁用本规则并写明理由。',
      noNativeMaxlength:
        '不要用原生 maxlength 限制用户可见文本；maxlength 按 UTF-16 code unit 截断。请在 input 事件里使用 truncateUnicodeCharacters(value, max) 并用 countUnicodeCharacters(value) 显示计数。',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          technicalNamePatterns: {
            type: 'array',
            items: { type: 'string' },
          },
          userTextNamePatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },
  create(context) {
    const ruleContext = createRuleContextCompat(context, '@sheng/no-native-string-user-text-ops', {
      requireSourceCode: true,
      requiredSourceCodeMethods: ['getText', 'getScope'],
    })
    const typeScriptServices = getTypeScriptServices(ruleContext)
    const options = resolveOptions(ruleContext)

    function checkMemberExpression(node) {
      if (getMemberPropertyName(node) !== 'length') return

      const target = unwrapExpression(node.object)
      if (!shouldReportUserTextOperation(ruleContext, target, node, typeScriptServices, options)) return

      ruleContext.report({
        node: node.property,
        messageId: 'noStringLength',
        data: {
          alternative: getLengthAlternative(ruleContext, target),
        },
      })
    }

    function checkCallExpression(node) {
      if (node.callee.type !== 'MemberExpression') return

      const methodName = getMemberPropertyName(node.callee)
      if (!methodName || !NATIVE_STRING_TEXT_METHODS.has(methodName)) return

      const target = unwrapExpression(node.callee.object)
      if (!shouldReportUserTextOperation(ruleContext, target, node, typeScriptServices, options)) return

      ruleContext.report({
        node: node.callee.property,
        messageId: 'noNativeStringMethod',
        data: {
          methodName,
          alternative: getNativeStringMethodAlternative(ruleContext, node, methodName, target),
        },
      })
    }

    function checkVueAttribute(node) {
      if (node.directive || getVueAttributeName(node) !== 'maxlength') return

      const elementName = getVueElementName(node)
      if (elementName !== 'input' && elementName !== 'textarea') return

      const type = getStaticVueAttributeValue(findStaticVueAttribute(node, 'type'))?.toLowerCase()
      if (type && MAXLENGTH_SAFE_INPUT_TYPES.has(type)) return
      if (!shouldReportVueMaxlength(ruleContext, node, options)) return

      ruleContext.report({
        node,
        messageId: 'noNativeMaxlength',
      })
    }

    const visitor = {
      CallExpression: checkCallExpression,
      MemberExpression: checkMemberExpression,
    }

    const parserServices = ruleContext.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {
          ...visitor,
          VAttribute: checkVueAttribute,
        },
        visitor,
      )
    }

    return visitor
  },
}
