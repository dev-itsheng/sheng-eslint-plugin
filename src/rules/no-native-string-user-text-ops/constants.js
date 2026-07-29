export const DEFAULT_STRING_LENGTH_ALTERNATIVE =
  '用户可见长度用 countUnicodeCharacters(value)，判空用 isUnicodeTextBlank(value)，超限用 isUnicodeTextOverLimit(value, max)，按字符切片 / 截断用 sliceUnicodeCharacters(value, start, end) 或 truncateUnicodeCharacters(value, max)'

// 这不是“禁用这些 string 方法”的黑名单。它只用于无 TypeScript 类型信息时识别
// `nickname.trim().length` 这类“方法返回值一定还是 string”的表达式；真正被禁止
// 的是后续 `.length`。每个方法都带替代建议，避免规则新增 case 时没有迁移路径。
export const STRING_RETURNING_METHOD_ALTERNATIVE_ENTRIES = [
  ['charAt', '按用户感知字符取单个字符，使用 getUnicodeCharacterAt(value, index)'],
  ['concat', '使用 countUnicodeCharacters(value.concat(...parts))'],
  ['normalize', '使用 countUnicodeCharacters(value.normalize(form))'],
  ['padEnd', '使用 countUnicodeCharacters(value.padEnd(length, fillString))'],
  ['padStart', '使用 countUnicodeCharacters(value.padStart(length, fillString))'],
  ['repeat', '使用 countUnicodeCharacters(value.repeat(count))'],
  ['replace', '使用 countUnicodeCharacters(value.replace(pattern, replacement))'],
  ['slice', '按用户感知字符切片使用 sliceUnicodeCharacters(value, start, end)，只限制最大长度使用 truncateUnicodeCharacters(value, max)'],
  ['substring', '按用户感知字符截取使用 substringUnicodeCharacters(value, start, end)，只限制最大长度使用 truncateUnicodeCharacters(value, max)'],
  ['toLocaleLowerCase', '使用 countUnicodeCharacters(value.toLocaleLowerCase(...locales))'],
  ['toLocaleUpperCase', '使用 countUnicodeCharacters(value.toLocaleUpperCase(...locales))'],
  ['toLowerCase', '使用 countUnicodeCharacters(value.toLowerCase())'],
  ['toUpperCase', '使用 countUnicodeCharacters(value.toUpperCase())'],
  ['trim', '判断空白输入使用 isUnicodeTextBlank(value)，需要统计 trim 后字符数使用 countTrimmedUnicodeCharacters(value)'],
  ['trimEnd', '使用 countUnicodeCharacters(value.trimEnd())；如果只是判空，优先用 isUnicodeTextBlank(value)'],
  ['trimStart', '使用 countUnicodeCharacters(value.trimStart())；如果只是判空，优先用 isUnicodeTextBlank(value)'],
]

export const STRING_REF_CREATOR_NAMES = ['computed', 'defineModel', 'ref', 'shallowRef', 'useState']
export const NATIVE_STRING_TEXT_METHOD_NAMES = ['charAt', 'slice', 'substring', 'substr']
export const STRING_ONLY_RETURNING_METHOD_NAMES = [
  'charAt',
  'normalize',
  'padEnd',
  'padStart',
  'repeat',
  'replace',
  'substring',
  'substr',
  'toLocaleLowerCase',
  'toLocaleUpperCase',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'trimEnd',
  'trimStart',
]
export const MAXLENGTH_SAFE_INPUT_TYPE_NAMES = [
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'file',
  'hidden',
  'month',
  'number',
  'password',
  'radio',
  'range',
  'reset',
  'submit',
  'tel',
  'time',
  'url',
  'week',
]

// 规则的目标不是“所有 string 都不能用原生 API”，而是保护用户可见文本。
// 默认技术名单只收非常稳定的协议 / 账号 / 路径 / 编码语义；如果某个项目有
// 自己的技术字段，例如 sku / serial / checksum，可以在 rule options 里追加。
// 这些词会匹配经过 camelCase / snake_case 拆词后的名字，例如
// `didFromCookie` 会变成 `did from cookie`，`CODE_LENGTH` 会变成 `code length`。
export const DEFAULT_TECHNICAL_NAME_WORDS = [
  'uid',
  'did',
  'id',
  'key',
  'keys',
  'i18n',
  'token',
  'cookie',
  'path',
  'url',
  'uri',
  'href',
  'host',
  'prefix',
  'suffix',
  'hash',
  'md5',
  'digest',
  'byte',
  'bytes',
  'buffer',
  'hex',
  'base64',
  'binary',
  'source',
  'brace',
  'code',
  'vcode',
  'otp',
  'password',
  'pwd',
  'phone',
  'tel',
  'number',
  'amount',
  'currency',
  'file',
  'filename',
  'extension',
  'ext',
  'mime',
  'uuid',
  'slug',
  'route',
  'cursor',
  'digit',
]

// 少数不是固定单词的命名模式放这里。保持短小，别重新堆成长正则。
export const DEFAULT_TECHNICAL_NAME_PATTERN_FRAGMENTS = ['sha\\d*']

// 默认用户文本名单用于兜住“技术词 + 文案词”混合命名，例如 codeTitle。
// 没命中技术名单的普通 string 仍会提示，所以这里不用放过宽的 `name`；
// 否则 `fileName`、`fromName` 这类技术字符串会被误判成用户文案。
export const DEFAULT_USER_TEXT_NAME_WORDS = [
  'nickname',
  'remark',
  'description',
  'signature',
  'bio',
  'title',
  'content',
  'comment',
  'message',
  'label',
  'placeholder',
  'search',
  'keyword',
  'query',
  'text',
  'prompt',
  'reason',
  'feedback',
]

export const DEFAULT_USER_TEXT_NAME_PHRASES = ['display name', 'user name', 'avatar name', 'category name', 'room name']
