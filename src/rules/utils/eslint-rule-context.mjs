function getProcessCwdFallback() {
  return typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.'
}

function isAbsolutePath(value) {
  return /^[/\\]/u.test(value) || /^[A-Za-z]:[/\\]/u.test(value)
}

function normalizePathSegments(value) {
  const input = toPosixPath(value)
  const driveMatch = input.match(/^([A-Za-z]:)(?:\/|$)/u)
  const prefix = driveMatch ? `${driveMatch[1]}/` : input.startsWith('/') ? '/' : ''
  const body = prefix ? input.slice(prefix.length) : input
  const segments = []

  for (const segment of body.split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      if (segments.length > 0 && segments.at(-1) !== '..') {
        segments.pop()
      } else if (!prefix) {
        segments.push(segment)
      }
      continue
    }

    segments.push(segment)
  }

  return `${prefix}${segments.join('/')}` || (prefix ? prefix.slice(0, -1) : '.')
}

function resolvePath(cwd, filename) {
  const normalizedFilename = toPosixPath(filename)
  if (isAbsolutePath(normalizedFilename)) return normalizePathSegments(normalizedFilename)
  return normalizePathSegments(`${toPosixPath(cwd)}/${normalizedFilename}`)
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/u, '')
}

function toNativePath(value) {
  if (typeof process !== 'undefined' && process.platform === 'win32') return value.replace(/\//gu, '\\')
  return value
}

export function detectEslintRuleApiFamily(context) {
  const hasModernFilename = typeof context.filename === 'string'
  const hasLegacyFilename = typeof context.getFilename === 'function'

  if (hasModernFilename && hasLegacyFilename) return 'eslint-8-or-9'
  if (hasModernFilename) return 'eslint-10-or-newer'
  if (hasLegacyFilename) return 'legacy-eslint'
  return 'unknown-eslint'
}

export function toPosixPath(value) {
  return String(value).replace(/\\/gu, '/')
}

export function getRuleCwd(context) {
  if (typeof context.cwd === 'string') return context.cwd
  if (typeof context.getCwd === 'function') return context.getCwd()
  return getProcessCwdFallback()
}

export function getRuleFilename(context) {
  if (typeof context.filename === 'string') return context.filename
  if (typeof context.getFilename === 'function') return context.getFilename()
  return '<input>'
}

export function getRuleSourceCode(context) {
  if (context.sourceCode) return context.sourceCode
  if (typeof context.getSourceCode === 'function') return context.getSourceCode()
  return null
}

export function getParserServices(context) {
  return getRuleSourceCode(context)?.parserServices ?? context.parserServices
}

export function getLiteralSource(node) {
  return node?.type === 'Literal' && typeof node.value === 'string' ? node.value : null
}

export function matchesPattern(value, patterns) {
  return patterns.some((pattern) => new RegExp(pattern).test(value))
}

export function normalizeRelativeFilename(filename, cwd) {
  const absoluteFilename = resolvePath(cwd, filename)
  const normalizedCwd = stripTrailingSlash(normalizePathSegments(cwd))
  const comparableFilename = absoluteFilename.toLowerCase()
  const comparableCwd = normalizedCwd.toLowerCase()

  if (comparableFilename === comparableCwd) return ''
  if (comparableFilename.startsWith(`${comparableCwd}/`)) {
    return absoluteFilename.slice(normalizedCwd.length + 1)
  }

  return absoluteFilename
}

export function normalizeAbsoluteFilename(filename, cwd) {
  return toNativePath(resolvePath(cwd, filename))
}

export function createRuleContextCompat(context, ruleName, { requireSourceCode = false, requiredSourceCodeMethods = [] } = {}) {
  const sourceCode = getRuleSourceCode(context)

  if (requireSourceCode && !sourceCode) {
    throw new Error(`${ruleName} 需要 ESLint RuleContext 提供 context.sourceCode 或 context.getSourceCode()；建议使用 ESLint 8、9 或 10。`)
  }

  for (const methodName of requiredSourceCodeMethods) {
    if (typeof sourceCode?.[methodName] !== 'function') {
      throw new Error(`${ruleName} 需要 SourceCode#${methodName}()；建议使用 ESLint 8、9 或 10，并确认解析器没有屏蔽 SourceCode API。`)
    }
  }

  const compatibleContext = Object.create(context)
  Object.defineProperties(compatibleContext, {
    cwd: {
      value: getRuleCwd(context),
      enumerable: true,
    },
    filename: {
      value: getRuleFilename(context),
      enumerable: true,
    },
    sourceCode: {
      value: sourceCode,
      enumerable: true,
    },
    parserServices: {
      value: sourceCode?.parserServices ?? context.parserServices,
      enumerable: true,
    },
    eslintRuleApiFamily: {
      value: detectEslintRuleApiFamily(context),
      enumerable: true,
    },
  })

  if (typeof context.report === 'function') {
    Object.defineProperty(compatibleContext, 'report', {
      value: (...args) => context.report(...args),
    })
  }

  return compatibleContext
}
