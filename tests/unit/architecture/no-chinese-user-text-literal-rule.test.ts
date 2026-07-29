import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noChineseUserTextLiteral from '../../../src/rules/no-chinese-user-text-literal/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-chinese-user-text-literal ESLint 规则', () => {
  it('扫描 JS/TS 运行时中文字符串，同时放过 import 和类型字面量', () => {
    ruleTester.run('project-style/no-chinese-user-text-literal', noChineseUserTextLiteral, {
      valid: [
        "const label = t('string_save')",
        "// 中文注释允许保留",
        "/* 中文块注释允许保留 */",
        "import message from './中文路径.json'",
        "export { default } from './中文路径'",
        {
          code: "type Status = '保存中'",
          languageOptions: {
            parser: tsParser,
          },
        },
        "const text = 'Save'",
      ],
      invalid: [
        {
          code: "const label = '保存中...'",
          errors: [{ messageId: 'chineseLiteral' }],
        },
        {
          code: 'const label = `保存中 ${count}`',
          errors: [{ messageId: 'chineseLiteral' }],
        },
        {
          code: "const map = { title: '暂无数据' }",
          errors: [{ messageId: 'chineseLiteral' }],
        },
      ],
    })
  })

  it('扫描 Vue template 文本和静态属性', () => {
    ruleTester.run('project-style/no-chinese-user-text-literal-vue-template', noChineseUserTextLiteral, {
      valid: [
        {
          code: `
            <!-- 顶层中文注释允许保留 -->
            <template>
              <!-- 模板中文注释允许保留 -->
              {{ t('string_save') }}
            </template>
          `,
          filename: 'valid.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: '<template><p>暂无数据</p></template>',
          filename: 'invalid-text.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'chineseTemplateText' }],
        },
        {
          code: '<template><input placeholder="请输入昵称" /></template>',
          filename: 'invalid-attribute.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'chineseLiteral' }],
        },
      ],
    })
  })
})
