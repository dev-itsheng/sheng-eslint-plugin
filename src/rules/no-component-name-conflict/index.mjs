const BUILT_IN_TAG_NAMES = new Set([
  'component',
  'keep-alive',
  'slot',
  'suspense',
  'teleport',
  'template',
  'transition',
  'transition-group',
])

const HTML_TAG_NAMES = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'svg',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
])

function camelize(name) {
  return name.replace(/-(\w)/g, (_match, character) => character.toUpperCase())
}

function capitalize(name) {
  return name ? `${name[0].toUpperCase()}${name.slice(1)}` : name
}

function isPascalCase(name) {
  return /^[A-Z]/.test(name)
}

function isLikelyVueFile(context) {
  return context.filename?.endsWith('.vue') || context.getFilename?.().endsWith('.vue')
}

function hasScriptSetup(sourceCode) {
  return /<script\b[^>]*\bsetup\b/i.test(sourceCode.text)
}

function isTypeOnlyImport(node, specifier) {
  return node.importKind === 'type' || specifier.importKind === 'type'
}

function collectPatternIdentifiers(pattern, names) {
  if (!pattern) return

  if (pattern.type === 'Identifier') {
    names.add(pattern.name)
    return
  }

  if (pattern.type === 'RestElement') {
    collectPatternIdentifiers(pattern.argument, names)
    return
  }

  if (pattern.type === 'AssignmentPattern') {
    collectPatternIdentifiers(pattern.left, names)
    return
  }

  if (pattern.type === 'ArrayPattern') {
    for (const element of pattern.elements) collectPatternIdentifiers(element, names)
    return
  }

  if (pattern.type === 'ObjectPattern') {
    for (const property of pattern.properties) {
      if (property.type === 'RestElement') {
        collectPatternIdentifiers(property.argument, names)
        continue
      }

      collectPatternIdentifiers(property.value, names)
    }
  }
}

function isTopLevelVariableDeclarator(node) {
  return node.parent?.type === 'VariableDeclaration' && node.parent.parent?.type === 'Program'
}

function isTopLevelDeclaration(node) {
  return node.parent?.type === 'Program'
}

function getRawTemplateTagName(node) {
  return node.rawName || node.name || ''
}

function shouldInspectTemplateTag(rawName) {
  if (!rawName) return false
  if (rawName.includes('.')) return false

  const lowerName = rawName.toLowerCase()
  if (BUILT_IN_TAG_NAMES.has(lowerName) || HTML_TAG_NAMES.has(lowerName)) return false

  return rawName.includes('-') || /^[a-z]/.test(rawName)
}

function getConflictForTag(rawName, importedComponents, ordinaryBindings) {
  if (!shouldInspectTemplateTag(rawName)) return null

  const camelName = camelize(rawName)
  const pascalName = capitalize(camelName)

  if (!ordinaryBindings.has(camelName)) return null
  if (!importedComponents.has(pascalName)) return null

  return {
    componentName: pascalName,
    localName: camelName,
    tagName: rawName,
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '避免 Vue <script setup> 中组件 import 和普通顶层绑定只靠大小写区分，导致 kebab-case 组件 tag 被解析到普通绑定。',
    },
    messages: {
      componentNameConflict:
        '<{{tagName}}> 会先解析到普通绑定 {{localName}}，真正的组件 {{componentName}} 可能不会渲染；请把状态变量改成更具体的名字，或把组件 tag 写成 <{{componentName}} /> / 给组件 import 起别名。',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    if (!isLikelyVueFile(context) || !hasScriptSetup(sourceCode)) return {}

    const importedComponents = new Set()
    const ordinaryBindings = new Set()
    const pendingTemplateTags = []
    const reportedNodes = new WeakSet()

    function reportTemplateTag(node, rawName) {
      if (reportedNodes.has(node)) return

      const conflict = getConflictForTag(rawName, importedComponents, ordinaryBindings)
      if (!conflict) return

      reportedNodes.add(node)
      context.report({
        node: node.startTag ?? node,
        messageId: 'componentNameConflict',
        data: conflict,
      })
    }

    const scriptVisitor = {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (isTypeOnlyImport(node, specifier)) continue
          if (specifier.type === 'ImportNamespaceSpecifier') continue
          if (!specifier.local?.name || !isPascalCase(specifier.local.name)) continue

          importedComponents.add(specifier.local.name)
        }
      },
      VariableDeclarator(node) {
        if (!isTopLevelVariableDeclarator(node)) return
        collectPatternIdentifiers(node.id, ordinaryBindings)
      },
      FunctionDeclaration(node) {
        if (!isTopLevelDeclaration(node) || !node.id?.name) return
        ordinaryBindings.add(node.id.name)
      },
      ClassDeclaration(node) {
        if (!isTopLevelDeclaration(node) || !node.id?.name) return
        ordinaryBindings.add(node.id.name)
      },
      'Program:exit'() {
        for (const { node, rawName } of pendingTemplateTags) {
          reportTemplateTag(node, rawName)
        }
      },
    }

    const templateVisitor = {
      VElement(node) {
        const rawName = getRawTemplateTagName(node)
        pendingTemplateTags.push({ node, rawName })
        reportTemplateTag(node, rawName)
      },
    }

    return sourceCode.parserServices?.defineTemplateBodyVisitor?.(templateVisitor, scriptVisitor) ?? scriptVisitor
  },
}
