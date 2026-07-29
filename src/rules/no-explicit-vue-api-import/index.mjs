import path from 'node:path'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'
import { DEFAULT_AUTO_IMPORTED_VUE_API_NAMES } from './constants.js'

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

function getImportedName(specifier) {
  if (specifier.type !== 'ImportSpecifier') return null
  if (specifier.importKind === 'type') return null

  const imported = specifier.imported
  if (imported.type === 'Identifier') return imported.name
  if (imported.type === 'Literal') return String(imported.value)
  return null
}

function resolveOptions(options) {
  const option = options[0] ?? {}
  return {
    names: new Set(Array.isArray(option.names) ? option.names : DEFAULT_AUTO_IMPORTED_VUE_API_NAMES),
    ignoredPathPatterns: Array.isArray(option.ignoredPathPatterns) ? option.ignoredPathPatterns : [],
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示 Vue 运行时 API 在 Nuxt SFC / app 代码里应使用自动导入，类型 import 仍允许显式保留。',
    },
    messages: {
      noExplicitVueApiImport:
        '{{name}} 已由 Nuxt 自动导入；请删掉这个 value import 后直接使用 {{name}}。如果还需要 Ref、ComputedRef 等类型，请只保留 `import type { ... } from "vue"`。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          names: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
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
    const ruleContext = createRuleContextCompat(context, '@sheng/no-explicit-vue-api-import')
    const cwd = ruleContext.cwd
    const filename = normalizeFilename(ruleContext.filename, cwd)
    const { names, ignoredPathPatterns } = resolveOptions(ruleContext.options)

    if (matchesIgnoredPath(filename, ignoredPathPatterns)) return {}

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'vue' || node.importKind === 'type') return

        for (const specifier of node.specifiers) {
          const importedName = getImportedName(specifier)
          if (!importedName || !names.has(importedName)) continue

          ruleContext.report({
            node: specifier,
            messageId: 'noExplicitVueApiImport',
            data: {
              name: importedName,
            },
          })
        }
      },
    }
  },
}
