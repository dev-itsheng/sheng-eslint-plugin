import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import preferKeyedObjectMap from '../../../src/rules/prefer-keyed-object-map/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('prefer-keyed-object-map ESLint 规则', () => {
  it('提醒同一个离散 key 的三元链改成对象字面量映射', () => {
    ruleTester.run('project-style/prefer-keyed-object-map', preferKeyedObjectMap, {
      valid: [
        "const label = count > 0 ? '有内容' : '暂无内容'",
        "const label = enabled ? '已开启' : '已关闭'",
        "const label = status === Status.Ready ? 'Ready' : 'Unknown'",
        'const label = status === Status.Ready ? buildReadyLabel() : buildFallbackLabel()',
        "const label = status === Status.Ready ? 'Ready' : otherStatus === Status.Error ? 'Error' : 'Unknown'",
        "const label = ({ [Status.Ready]: 'Ready', [Status.Error]: 'Error' })[status] ?? 'Unknown'",
        "const label = user.role === Role.Admin ? 'Admin' : 'User'",
        "function getLabel(status) { if (status === Status.Ready) return 'Ready'; return 'Unknown' }",
        "function getLabel(count) { if (count > 0) return '有内容'; return '暂无内容' }",
      ],
      invalid: [
        {
          code: "const label = status === Status.Ready ? 'Ready' : status === Status.Error ? 'Error' : 'Unknown'",
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
        {
          code: "const label = 'ready' === status ? 'Ready' : status === 'error' ? 'Error' : 'Unknown'",
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
        {
          code: "const label = status == 'ready' ? 'Ready' : status == 'error' ? 'Error' : fallback",
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
        {
          code: 'const message = tab === SectionTab.Profile ? buildProfile() : tab === SectionTab.Stats ? buildStats() : buildFallback()',
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
        {
          code: "const label = mode.value === GalleryMode.Public ? '公开相册' : mode.value === GalleryMode.Private ? '私有相册' : '未知'",
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
        {
          code: "function getLabel(status) { if (status === Status.Ready) return 'Ready'; if (status === Status.Error) return 'Error'; return 'Unknown' }",
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
        {
          code: "function getLabel(status) { if (status === Status.Ready) return 'Ready'; else if (status === Status.Error) return 'Error'; else return 'Unknown' }",
          errors: [{ messageId: 'preferKeyedObjectMap' }],
        },
      ],
    })
  })

  it('在 TypeScript parser services 可用时识别封闭二值类型', () => {
    ruleTester.run('project-style/prefer-keyed-object-map-typed', preferKeyedObjectMap, {
      valid: [
        {
          code: "declare const status: 'ready' | 'error' | 'pending'; const label = status === 'ready' ? 'Ready' : 'Fallback'",
          filename: 'prefer-keyed-object-map-typed-valid.ts',
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              projectService: {
                allowDefaultProject: ['*.ts'],
              },
              tsconfigRootDir: process.cwd(),
            },
          },
        },
      ],
      invalid: [
        {
          code: "declare const status: 'ready' | 'error'; const label = status === 'ready' ? 'Ready' : 'Error'",
          filename: 'prefer-keyed-object-map-typed-invalid.ts',
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              projectService: {
                allowDefaultProject: ['*.ts'],
              },
              tsconfigRootDir: process.cwd(),
            },
          },
          errors: [{ messageId: 'preferTypedBinaryMap' }],
        },
        {
          code: `
            const enum BalanceButtonType {
              Coin = 'coin',
              Diamond = 'diamond',
            }

            declare const type: { value: BalanceButtonType }
            declare const coinSrc: string
            declare const pointsSrc: string

            const iconSrc = computed(() => {
              if (type.value === BalanceButtonType.Coin) return coinSrc

              return pointsSrc
            })
          `,
          filename: 'prefer-keyed-object-map-typed-enum-invalid.ts',
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              projectService: {
                allowDefaultProject: ['*.ts'],
              },
              tsconfigRootDir: process.cwd(),
            },
          },
          errors: [{ messageId: 'preferTypedBinaryMap' }],
        },
      ],
    })
  })
})
