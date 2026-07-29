import path from 'node:path'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'
import { resolveNuxtComponentNameFromRelativePath } from '../utils/nuxt-component-name.mjs'

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

function stripImportQuery(source) {
  return String(source).split('?')[0]
}

function importSourceIsRelative(source) {
  return source.startsWith('./') || source.startsWith('../')
}

function sourceIsVueComponent(source) {
  return stripImportQuery(source).endsWith('.vue')
}

function resolveSourceAbsolutePath(filename, source, cwd) {
  const cleanSource = stripImportQuery(source)
  const fileDirectory = path.dirname(path.resolve(cwd, filename))

  if (importSourceIsRelative(cleanSource)) return path.resolve(fileDirectory, cleanSource)
  if (cleanSource.startsWith('~/components/')) return path.resolve(cwd, 'app/components', cleanSource.slice('~/components/'.length))
  if (cleanSource.startsWith('@/components/')) return path.resolve(cwd, 'app/components', cleanSource.slice('@/components/'.length))
  if (cleanSource.startsWith('~/app/components/')) return path.resolve(cwd, cleanSource.slice('~/'.length))
  if (cleanSource.startsWith('@/app/components/')) return path.resolve(cwd, cleanSource.slice('@/'.length))

  return null
}

function pathIsUnderAppComponents(absolutePath, cwd) {
  const relativePath = toPosixPath(path.relative(path.resolve(cwd, 'app/components'), absolutePath))
  return Boolean(relativePath && !relativePath.startsWith('../') && !path.isAbsolute(relativePath))
}

function resolveAutoImportComponentName(absolutePath, cwd) {
  if (!absolutePath || !pathIsUnderAppComponents(absolutePath, cwd)) return '对应的 Nuxt 自动导入组件名'

  const relativePath = toPosixPath(path.relative(path.resolve(cwd, 'app/components'), absolutePath)).replace(/\.vue$/, '')
  return resolveNuxtComponentNameFromRelativePath(relativePath) || '对应的 Nuxt 自动导入组件名'
}

function getViolationKind(filename, source, absoluteSourcePath, cwd) {
  const inAppComponents = filename.startsWith('app/components/')
  if (inAppComponents && importSourceIsRelative(source)) return 'componentRelativeImport'
  if (inAppComponents && absoluteSourcePath && pathIsUnderAppComponents(absoluteSourcePath, cwd)) return 'componentAliasImport'

  const inAppPages = filename.startsWith('app/pages/')
  if (inAppPages && absoluteSourcePath && pathIsUnderAppComponents(absoluteSourcePath, cwd)) return 'pageComponentImport'

  return null
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '提示 Nuxt 组件应使用自动导入名，避免在组件和页面里显式 import .vue 组件。',
    },
    messages: {
      componentRelativeImport:
        'app/components 内不要相对路径显式 import Vue 组件；请删掉这个 import，并在 template 里直接使用 <{{componentName}} /> 这样的 Nuxt 自动导入组件名。',
      componentAliasImport:
        'app/components 内不要通过别名显式 import app/components 下的 Vue 组件；请删掉这个 import，并在 template 里直接使用 <{{componentName}} /> 这样的 Nuxt 自动导入组件名。',
      pageComponentImport:
        'app/pages 内不要显式 import app/components 下的 Vue 组件；请删掉这个 import，并在 template 里直接使用 <{{componentName}} /> 这样的 Nuxt 自动导入组件名。',
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
    const ruleContext = createRuleContextCompat(context, '@sheng/no-explicit-vue-component-import')
    const cwd = ruleContext.cwd
    const filename = normalizeFilename(ruleContext.filename, cwd)
    const options = ruleContext.options[0] ?? {}
    const ignoredPathPatterns = Array.isArray(options.ignoredPathPatterns) ? options.ignoredPathPatterns : []

    if (matchesIgnoredPath(filename, ignoredPathPatterns)) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== 'string' || !sourceIsVueComponent(source)) return

        const absoluteSourcePath = resolveSourceAbsolutePath(filename, source, cwd)
        const violationKind = getViolationKind(filename, stripImportQuery(source), absoluteSourcePath, cwd)
        if (!violationKind) return

        ruleContext.report({
          node,
          messageId: violationKind,
          data: {
            componentName: resolveAutoImportComponentName(absoluteSourcePath, cwd),
          },
        })
      },
    }
  },
}
