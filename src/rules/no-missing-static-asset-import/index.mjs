import fs from 'node:fs'
import path from 'node:path'
import { createRuleContextCompat } from '../utils/eslint-rule-context.mjs'

const DEFAULT_STATIC_ASSET_EXTENSIONS = ['.avif', '.gif', '.jpeg', '.jpg', '.json', '.mp3', '.mp4', '.ogg', '.png', '.svg', '.wav', '.webm', '.webp']
const DEFAULT_ALIASES = [
  { prefix: '~/', target: 'app/' },
  { prefix: '@/', target: 'app/' },
  { prefix: '~~/', target: '' },
  { prefix: '@@/', target: '' },
  { prefix: '#shared/', target: 'shared/' },
  { prefix: '#server/', target: 'server/' },
]

function stripImportQuery(source) {
  return String(source).split(/[?#]/)[0]
}

function normalizeExtension(extension) {
  const value = String(extension || '').trim()
  if (!value) return ''
  return value.startsWith('.') ? value : `.${value}`
}

function sourceIsStaticAsset(source, assetExtensions) {
  return assetExtensions.has(path.extname(stripImportQuery(source)))
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function normalizeFilename(filename, cwd) {
  if (!filename || filename === '<input>') return null
  return path.isAbsolute(filename) ? filename : path.resolve(cwd, filename)
}

function normalizeAliases(aliases) {
  if (!Array.isArray(aliases)) return DEFAULT_ALIASES

  return aliases
    .filter((alias) => typeof alias?.prefix === 'string' && typeof alias?.target === 'string')
    .map((alias) => ({
      prefix: alias.prefix,
      target: alias.target,
    }))
}

function resolveAliasTarget(cwd, target) {
  return path.isAbsolute(target) ? target : path.resolve(cwd, target)
}

function resolveImportSource(filename, source, cwd, aliases) {
  const cleanSource = stripImportQuery(source)
  const fromDirectory = path.dirname(filename)

  if (cleanSource.startsWith('./') || cleanSource.startsWith('../')) return path.resolve(fromDirectory, cleanSource)

  for (const alias of aliases) {
    if (!cleanSource.startsWith(alias.prefix)) continue

    return path.resolve(resolveAliasTarget(cwd, alias.target), cleanSource.slice(alias.prefix.length))
  }

  return null
}

function resolveOptions(options) {
  const option = options[0] ?? {}

  return {
    aliases: normalizeAliases(option.aliases),
    assetExtensions: new Set((Array.isArray(option.assetExtensions) ? option.assetExtensions : DEFAULT_STATIC_ASSET_EXTENSIONS).map(normalizeExtension).filter(Boolean)),
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '检查静态资源 import 的目标文件是否真实存在，避免 dev/build 阶段才暴露缺文件。',
    },
    messages: {
      missingAsset: '静态资源 import 指向的文件不存在：{{source}}。请检查相对路径，或按项目配置正确的 alias target。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          aliases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                prefix: { type: 'string' },
                target: { type: 'string' },
              },
              required: ['prefix', 'target'],
              additionalProperties: false,
            },
          },
          assetExtensions: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const compat = createRuleContextCompat(context, 'no-missing-static-asset-import')
    const cwd = compat.cwd
    const filename = normalizeFilename(compat.filename, cwd)
    const { aliases, assetExtensions } = resolveOptions(context.options)
    if (!filename) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== 'string' || !sourceIsStaticAsset(source, assetExtensions)) return

        const absoluteSourcePath = resolveImportSource(filename, source, cwd, aliases)
        if (!absoluteSourcePath || fileExists(absoluteSourcePath)) return

        context.report({
          node: node.source,
          messageId: 'missingAsset',
          data: {
            source,
          },
        })
      },
    }
  },
}
