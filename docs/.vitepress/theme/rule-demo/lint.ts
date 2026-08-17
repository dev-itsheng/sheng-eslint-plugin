import type { RuleDemoExample } from './demos'

export type RuleDemoProblem = {
  column: number
  endColumn: number
  endLine: number
  line: number
  message: string
  ruleId: string
  severity: 1 | 2
}

type RuleRunner = (code: string, example: RuleDemoExample) => RuleDemoProblem[]

const htmlTagNames = new Set([
  'a',
  'button',
  'div',
  'form',
  'h1',
  'h2',
  'h3',
  'img',
  'input',
  'label',
  'li',
  'main',
  'p',
  'section',
  'span',
  'template',
  'textarea',
  'ul',
])

const builtInDirectiveNames = new Set([
  'bind',
  'else',
  'else-if',
  'for',
  'html',
  'if',
  'model',
  'on',
  'show',
  'slot',
  'text',
])

const autoImportedVueApiNames = new Set([
  'computed',
  'customRef',
  'defineAsyncComponent',
  'effectScope',
  'getCurrentInstance',
  'inject',
  'nextTick',
  'onActivated',
  'onBeforeMount',
  'onBeforeUnmount',
  'onBeforeUpdate',
  'onDeactivated',
  'onErrorCaptured',
  'onMounted',
  'onRenderTracked',
  'onRenderTriggered',
  'onScopeDispose',
  'onServerPrefetch',
  'onUnmounted',
  'onUpdated',
  'provide',
  'reactive',
  'readonly',
  'ref',
  'shallowReactive',
  'shallowReadonly',
  'shallowRef',
  'toRef',
  'toRefs',
  'triggerRef',
  'watch',
  'watchEffect',
  'watchPostEffect',
  'watchSyncEffect',
])

function camelize(name: string) {
  return name.replace(/-(\w)/gu, (_match, character: string) => character.toUpperCase())
}

function capitalize(name: string) {
  return name ? `${name[0].toUpperCase()}${name.slice(1)}` : name
}

function getLineStarts(code: string) {
  const starts = [0]
  for (let index = 0; index < code.length; index += 1) {
    if (code[index] === '\n') starts.push(index + 1)
  }
  return starts
}

function getPosition(lineStarts: number[], index: number) {
  let lineIndex = 0
  for (let next = 1; next < lineStarts.length; next += 1) {
    if (lineStarts[next] > index) break
    lineIndex = next
  }

  return {
    column: index - lineStarts[lineIndex] + 1,
    line: lineIndex + 1,
  }
}

function createProblem(
  code: string,
  index: number,
  length: number,
  message: string,
  ruleName: string,
  severity: 1 | 2 = 1,
): RuleDemoProblem {
  const lineStarts = getLineStarts(code)
  const start = getPosition(lineStarts, Math.max(0, index))
  const end = getPosition(lineStarts, Math.max(index + 1, index + length))

  return {
    column: start.column,
    endColumn: Math.max(end.column, start.line === end.line ? start.column + 1 : end.column),
    endLine: end.line,
    line: start.line,
    message,
    ruleId: `@sheng/${ruleName}`,
    severity,
  }
}

function collectCommentRanges(code: string) {
  const ranges: Array<{ end: number; start: number }> = []
  const commentPattern = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gmu
  let match: RegExpExecArray | null

  while ((match = commentPattern.exec(code))) {
    const matchedText = match[0] || ''
    const lineCommentPrefix = match[1] || ''
    const start = matchedText.startsWith('//') || !lineCommentPrefix
      ? match.index
      : match.index + lineCommentPrefix.length
    ranges.push({
      end: match.index + matchedText.length,
      start,
    })
  }

  return ranges
}

function indexIsInRanges(index: number, ranges: Array<{ end: number; start: number }>) {
  return ranges.some(range => index >= range.start && index < range.end)
}

function filterProblemsByRuleName(problems: RuleDemoProblem[], ruleName: string) {
  return problems.filter(problem => problem.ruleId === `@sheng/${ruleName}`)
}

function runI18nCopyRules(code: string) {
  const problems: RuleDemoProblem[] = []
  const commentRanges = collectCommentRanges(code)
  const dynamicKeyPattern = /\b(t|\$t|translateLegacy)\s*\(\s*(`[^`]*\$\{[\s\S]*?\}[^`]*`|[A-Za-z_$][\w$.]*)/gu
  let dynamicMatch: RegExpExecArray | null

  while ((dynamicMatch = dynamicKeyPattern.exec(code))) {
    if (indexIsInRanges(dynamicMatch.index, commentRanges)) continue
    const argument = dynamicMatch[2] || ''
    const argumentIndex = dynamicMatch.index + dynamicMatch[0].lastIndexOf(argument)
    problems.push(createProblem(
      code,
      argumentIndex,
      argument.length,
      `${dynamicMatch[1]}() 的第一个参数必须是字符串字面量；动态 key 会让 IDE i18n 插件和静态扫描失效。`,
      'no-dynamic-i18n-t-key',
    ))
  }

  const fallbackPattern = /\bfallback\s*:/gu
  let fallbackMatch: RegExpExecArray | null
  while ((fallbackMatch = fallbackPattern.exec(code))) {
    if (indexIsInRanges(fallbackMatch.index, commentRanges)) continue
    problems.push(createProblem(
      code,
      fallbackMatch.index,
      'fallback'.length,
      '不要在翻译函数里传 fallback；缺失 key 应该暴露给 i18n 流程。',
      'no-i18n-t-fallback',
    ))
  }

  const chineseTextPattern = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/gu
  let chineseMatch: RegExpExecArray | null
  while ((chineseMatch = chineseTextPattern.exec(code))) {
    if (indexIsInRanges(chineseMatch.index, commentRanges)) continue
    problems.push(createProblem(
      code,
      chineseMatch.index,
      chineseMatch[0].length,
      '运行时代码里不要直接写中文字面量；如果这是用户可见文案，请改用 i18n key，或先登记到项目文案清单。',
      'no-chinese-user-text-literal',
    ))
  }

  return problems
}

function runDomStyleRules(code: string) {
  const problems: RuleDemoProblem[] = []
  const domQueryPattern = /\b(querySelectorAll|querySelector|getElementById|getElementsByClassName|getElementsByName|getElementsByTagName)\b/gu
  let domMatch: RegExpExecArray | null

  while ((domMatch = domQueryPattern.exec(code))) {
    problems.push(createProblem(
      code,
      domMatch.index,
      domMatch[0].length,
      `组件/页面里不要用 ${domMatch[0]} 查找 DOM；优先用 template ref / function ref 显式拿到元素。`,
      'no-dom-query-in-component',
    ))
  }

  const staticPxPattern = /['"`][^'"`\n]*\b-?\d*\.?\d+px\b[^'"`\n]*['"`]/gu
  let pxMatch: RegExpExecArray | null
  while ((pxMatch = staticPxPattern.exec(code))) {
    problems.push(createProblem(
      code,
      pxMatch.index,
      pxMatch[0].length,
      '固定 px 样式不要写在 :style 的 JS 对象里；静态尺寸请放到组件样式层。',
      'no-static-px-inline-style',
    ))
  }

  return problems
}

function runAssetWatchRules(code: string) {
  const problems: RuleDemoProblem[] = []
  const staticAssetPattern = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+\.(?:avif|gif|jpe?g|json|mp3|mp4|ogg|png|svg|wav|webm|webp)(?:[?#][^'"]*)?)['"]/giu
  let assetMatch: RegExpExecArray | null

  while ((assetMatch = staticAssetPattern.exec(code))) {
    const source = assetMatch[1] || ''
    if (!/\b(?:missing|not-found|wrong|empty-state)\b/iu.test(source)) continue
    const sourceIndex = assetMatch.index + assetMatch[0].lastIndexOf(source)
    problems.push(createProblem(
      code,
      sourceIndex,
      source.length,
      `静态资源 import 指向的文件不存在：${source}。请检查相对路径，或按项目配置正确的 alias target。`,
      'no-missing-static-asset-import',
      2,
    ))
  }

  if (/\bwatch\s*\(/u.test(code)) {
    const comparePattern = /\bif\s*\(\s*([A-Za-z_$][\w$]*)\s*={2,3}\s*([A-Za-z_$][\w$]*)\s*\)/gu
    let compareMatch: RegExpExecArray | null
    while ((compareMatch = comparePattern.exec(code))) {
      const left = compareMatch[1] || ''
      const right = compareMatch[2] || ''
      if (!/(?:next|new|current)/iu.test(left) || !/(?:prev|old|previous)/iu.test(right)) continue
      problems.push(createProblem(
        code,
        compareMatch.index,
        compareMatch[0].length,
        'Vue watch 默认只在 source 变化后触发；这里的 next === previous 比较通常是无意义防御，会让真实业务条件被噪音盖住。',
        'no-redundant-watch-source-compare',
      ))
    }
  }

  return problems
}

function runTypeReadabilityRules(code: string) {
  const problems: RuleDemoProblem[] = []
  const commentRanges = collectCommentRanges(code)
  const typeImportNames = new Set<string>()
  const typeImportRanges: Array<{ end: number; start: number }> = []
  const typeImportPattern = /import\s+type\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/gu
  let typeImportMatch: RegExpExecArray | null

  while ((typeImportMatch = typeImportPattern.exec(code))) {
    if (indexIsInRanges(typeImportMatch.index, commentRanges)) continue
    typeImportRanges.push({
      end: typeImportMatch.index + typeImportMatch[0].length,
      start: typeImportMatch.index,
    })
    for (const rawName of (typeImportMatch[1] || '').split(',')) {
      const name = rawName.trim().split(/\s+as\s+/iu).pop()
      if (name && /^[A-Za-z_$][\w$]*$/u.test(name)) typeImportNames.add(name)
    }
  }

  for (const name of typeImportNames) {
    const referencePattern = new RegExp(`\\b${name}\\b`, 'gu')
    let referenceMatch: RegExpExecArray | null
    while ((referenceMatch = referencePattern.exec(code))) {
      if (indexIsInRanges(referenceMatch.index, commentRanges)) continue
      if (indexIsInRanges(referenceMatch.index, typeImportRanges)) continue
      problems.push(createProblem(
        code,
        referenceMatch.index,
        name.length,
        `${name} 来自 type-only import，但这里按运行时值使用；请改成普通 import，或只在类型位置使用它。`,
        'no-type-import-used-as-value',
        2,
      ))
      break
    }
  }

  const ternaryPattern = /\b([A-Za-z_$][\w$.]*)\s*(?:===|==)\s*[^?\n]+\?\s*[^:\n]+:\s*\1\s*(?:===|==)\s*[^?\n]+\?/gu
  let ternaryMatch: RegExpExecArray | null
  while ((ternaryMatch = ternaryPattern.exec(code))) {
    if (indexIsInRanges(ternaryMatch.index, commentRanges)) continue
    problems.push(createProblem(
      code,
      ternaryMatch.index,
      ternaryMatch[0].length,
      '同一个离散 key 的多分支判断优先改成对象字面量 + key 映射。',
      'prefer-keyed-object-map',
    ))
  }

  const singleUseMapPattern = /const\s+([A-Za-z_$][\w$]*)\s*=\s*\{[\s\S]*?\}\s*\nconst\s+[A-Za-z_$][\w$]*\s*=\s*\1\[[^\]]+\]/gu
  let mapMatch: RegExpExecArray | null
  while ((mapMatch = singleUseMapPattern.exec(code))) {
    if (indexIsInRanges(mapMatch.index, commentRanges)) continue
    const mapName = mapMatch[1] || ''
    const nameIndex = mapMatch.index + mapMatch[0].indexOf(mapName)
    problems.push(createProblem(
      code,
      nameIndex,
      mapName.length,
      '只被索引读取一次的临时映射表可以直接内联到使用处，减少没有复用语义的命名。',
      'prefer-inline-single-use-map',
    ))
  }

  const trivialComputedPattern = /\bconst\s+[A-Za-z_$][\w$]*\s*=\s*computed\s*\(\s*(?:\(\s*\)\s*=>\s*(?:[A-Za-z_$][\w$.]*\s*\(\s*['"][^'"]+['"]\s*\)|\(\s*\{[\s\S]*?\}\s*\)|\{[\s\S]*?\})|function\s*\(\s*\)\s*\{\s*return\s+[A-Za-z_$][\w$.]*\s*\(\s*['"][^'"]+['"]\s*\))/gu
  let computedMatch: RegExpExecArray | null
  while ((computedMatch = trivialComputedPattern.exec(code))) {
    if (indexIsInRanges(computedMatch.index, commentRanges)) continue
    problems.push(createProblem(
      code,
      computedMatch.index,
      computedMatch[0].length,
      '这个 computed 只是静态 i18n 调用或简单 class map 的薄包装；请直接内联到模板或调用处。',
      'prefer-inline-trivial-computed',
    ))
  }

  const toRefPropsPattern = /\btoRef\s*\(\s*props\s*,\s*['"`]([A-Za-z_$][\w$]*)['"`]\s*\)|\bprops\.([A-Za-z_$][\w$]*)/gu
  let propsMatch: RegExpExecArray | null
  while ((propsMatch = toRefPropsPattern.exec(code))) {
    if (indexIsInRanges(propsMatch.index, commentRanges)) continue
    problems.push(createProblem(
      code,
      propsMatch.index,
      propsMatch[0].length,
      '组件脚本里统一先 const { key } = toRefs(props)，避免混用 props.xxx 或 toRef(props, key)。',
      'prefer-to-refs-props',
    ))
  }

  const indexedRecordSatisfiesPattern = /\}\s*satisfies\s+Record\s*<[^>]+>\s*\)\s*\[[^\]]+\]/gu
  let indexedRecordMatch: RegExpExecArray | null
  while ((indexedRecordMatch = indexedRecordSatisfiesPattern.exec(code))) {
    if (indexIsInRanges(indexedRecordMatch.index, commentRanges)) continue
    const satisfiesIndex = indexedRecordMatch.index + indexedRecordMatch[0].indexOf('satisfies')
    problems.push(createProblem(
      code,
      satisfiesIndex,
      'satisfies'.length,
      '对象字面量完整映射后马上索引读取时，不需要再套 satisfies Record<...>。',
      'no-redundant-indexed-record-satisfies',
    ))
  }

  return problems
}

function collectImportNames(code: string) {
  const importedNames = new Set<string>()
  const importPattern = /import\s+(?!type\b)([\w$]+|\{[\s\S]*?\})\s+from\s+['"][^'"]+['"]/gu
  let importMatch: RegExpExecArray | null

  while ((importMatch = importPattern.exec(code))) {
    const specifier = importMatch[1] || ''
    if (specifier.startsWith('{')) {
      for (const rawName of specifier.slice(1, -1).split(',')) {
        const localName = rawName.trim().split(/\s+as\s+/iu).pop()
        if (localName && /^[A-Za-z_$][\w$]*$/u.test(localName)) importedNames.add(localName)
      }
      continue
    }

    importedNames.add(specifier)
  }

  return importedNames
}

function collectTopLevelBindingNames(code: string) {
  const names = new Set<string>()
  const bindingPattern = /(?:^|\n)\s*(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gu
  let bindingMatch: RegExpExecArray | null

  while ((bindingMatch = bindingPattern.exec(code))) {
    if (bindingMatch[1]) names.add(bindingMatch[1])
  }

  return names
}

function runComponentNameConflictRule(code: string) {
  const problems: RuleDemoProblem[] = []
  const importedNames = collectImportNames(code)
  const ordinaryBindings = collectTopLevelBindingNames(code)
  const tagPattern = /<([a-z][\w-]*)\b/gu
  let tagMatch: RegExpExecArray | null

  while ((tagMatch = tagPattern.exec(code))) {
    const rawName = tagMatch[1] || ''
    if (!rawName || htmlTagNames.has(rawName) || rawName.includes('.')) continue
    if (!rawName.includes('-') && !/^[a-z]/u.test(rawName)) continue

    const camelName = camelize(rawName)
    const pascalName = capitalize(camelName)
    if (!ordinaryBindings.has(camelName) || !importedNames.has(pascalName)) continue
    problems.push(createProblem(
      code,
      tagMatch.index + 1,
      rawName.length,
      `<${rawName}> 同时能对应普通绑定 ${camelName} 和组件 ${pascalName}；请重命名普通变量、改用 PascalCase tag，或给组件 import 起别名。`,
      'no-component-name-conflict',
      2,
    ))
  }

  const directivePattern = /\bv-([a-z][\w-]*)\b/gu
  let directiveMatch: RegExpExecArray | null
  while ((directiveMatch = directivePattern.exec(code))) {
    const rawName = directiveMatch[1] || ''
    if (!rawName || builtInDirectiveNames.has(rawName)) continue
    const camelName = camelize(`v-${rawName}`)
    const pascalName = capitalize(camelName)
    if (!ordinaryBindings.has(camelName) || !importedNames.has(pascalName)) continue
    problems.push(createProblem(
      code,
      directiveMatch.index,
      directiveMatch[0].length,
      `v-${rawName} 同时能对应普通绑定 ${camelName} 和指令 ${pascalName}；请让指令名候选保持唯一。`,
      'no-component-name-conflict',
      2,
    ))
  }

  return problems
}

function runNestedDefinePropsRule(code: string) {
  const problems: RuleDemoProblem[] = []
  const nestedPattern = /\b(toRefs|toRef|readonly|reactive)\s*\([\s\S]{0,120}\bdefineProps\s*(?:<[^>]+>)?\s*\(/gu
  let nestedMatch: RegExpExecArray | null

  while ((nestedMatch = nestedPattern.exec(code))) {
    problems.push(createProblem(
      code,
      nestedMatch.index,
      nestedMatch[0].length,
      '不要把 defineProps() 包进普通运行时表达式；请先 const props = defineProps()，再把 props 传给后续函数。',
      'no-nested-define-props',
      2,
    ))
  }

  return problems
}

function runExplicitVueApiImportRule(code: string) {
  const problems: RuleDemoProblem[] = []
  const importPattern = /import\s+\{([^}]+)\}\s+from\s+['"]vue['"]/gu
  let importMatch: RegExpExecArray | null

  while ((importMatch = importPattern.exec(code))) {
    const specifierStart = importMatch.index + importMatch[0].indexOf(importMatch[1] || '')
    let offset = 0
    for (const rawSpecifier of (importMatch[1] || '').split(',')) {
      const rawIndex = code.indexOf(rawSpecifier, specifierStart + offset)
      offset = rawIndex - specifierStart + rawSpecifier.length
      const specifier = rawSpecifier.trim()
      if (!specifier || /^type\b/u.test(specifier)) continue
      const localName = specifier.split(/\s+as\s+/iu)[0]?.trim()
      if (!localName || !autoImportedVueApiNames.has(localName)) continue
      problems.push(createProblem(
        code,
        rawIndex + rawSpecifier.indexOf(localName),
        localName.length,
        `${localName} 已由 Nuxt 自动导入；请删掉这个 value import，只保留必要的 import type。`,
        'no-explicit-vue-api-import',
      ))
    }
  }

  return problems
}

function runSsrUnsafeModuleStateRule(code: string, example: RuleDemoExample) {
  if (!/\/use[A-Z][^/]*\.(?:ts|js)$/u.test(example.filename.replaceAll('\\', '/'))) return []
  const problems: RuleDemoProblem[] = []
  const statePattern = /(?:^|\n)\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:ref|reactive|shallowRef|shallowReactive)\s*\(/gu
  let stateMatch: RegExpExecArray | null

  while ((stateMatch = statePattern.exec(code))) {
    const name = stateMatch[1] || ''
    const nameIndex = stateMatch.index + stateMatch[0].indexOf(name)
    problems.push(createProblem(
      code,
      nameIndex,
      name.length,
      'Nuxt use* composable 的模块级可变状态需要显式声明 SSR 策略，避免请求间共享状态。',
      'no-ssr-unsafe-module-state',
      2,
    ))
  }

  return problems
}

const runners: Record<string, RuleRunner> = {
  'no-chinese-user-text-literal': code => filterProblemsByRuleName(runI18nCopyRules(code), 'no-chinese-user-text-literal'),
  'no-component-name-conflict': code => runComponentNameConflictRule(code),
  'no-dom-query-in-component': code => filterProblemsByRuleName(runDomStyleRules(code), 'no-dom-query-in-component'),
  'no-dynamic-i18n-t-key': code => filterProblemsByRuleName(runI18nCopyRules(code), 'no-dynamic-i18n-t-key'),
  'no-explicit-vue-api-import': code => runExplicitVueApiImportRule(code),
  'no-i18n-t-fallback': code => filterProblemsByRuleName(runI18nCopyRules(code), 'no-i18n-t-fallback'),
  'no-missing-static-asset-import': code => filterProblemsByRuleName(runAssetWatchRules(code), 'no-missing-static-asset-import'),
  'no-nested-define-props': code => runNestedDefinePropsRule(code),
  'no-redundant-indexed-record-satisfies': code => filterProblemsByRuleName(runTypeReadabilityRules(code), 'no-redundant-indexed-record-satisfies'),
  'no-redundant-watch-source-compare': code => filterProblemsByRuleName(runAssetWatchRules(code), 'no-redundant-watch-source-compare'),
  'no-ssr-unsafe-module-state': (code, example) => runSsrUnsafeModuleStateRule(code, example),
  'no-static-px-inline-style': code => filterProblemsByRuleName(runDomStyleRules(code), 'no-static-px-inline-style'),
  'no-type-import-used-as-value': code => filterProblemsByRuleName(runTypeReadabilityRules(code), 'no-type-import-used-as-value'),
  'prefer-inline-single-use-map': code => filterProblemsByRuleName(runTypeReadabilityRules(code), 'prefer-inline-single-use-map'),
  'prefer-inline-trivial-computed': code => filterProblemsByRuleName(runTypeReadabilityRules(code), 'prefer-inline-trivial-computed'),
  'prefer-keyed-object-map': code => filterProblemsByRuleName(runTypeReadabilityRules(code), 'prefer-keyed-object-map'),
  'prefer-to-refs-props': code => filterProblemsByRuleName(runTypeReadabilityRules(code), 'prefer-to-refs-props'),
}

export function runRuleDemo(ruleName: string, code: string, example: RuleDemoExample) {
  return runners[ruleName]?.(code, example) ?? []
}
