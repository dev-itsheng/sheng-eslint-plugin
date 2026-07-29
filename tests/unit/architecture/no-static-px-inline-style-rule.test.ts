import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import noStaticPxInlineStyle from '../../../src/rules/no-static-px-inline-style/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('no-static-px-inline-style ESLint 规则', () => {
  it('提示 Vue template 里绑定固定 px style object 的写法', () => {
    ruleTester.run('project-style/no-static-px-inline-style', noStaticPxInlineStyle, {
      valid: [
        {
          code: `
            <script setup>
            const color = '#fff'
            </script>

            <template>
              <div :style="{ '--avatar-color': color }" />
            </template>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
        {
          code: `
            <template>
              <button class="profile-action-button" />
            </template>

            <style scoped>
            .profile-action-button {
              height: 44px;
              padding: 0 16px;
            }
            </style>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: `
            <script setup>
            const buttonStyle = {
              height: '44px',
              paddingLeft: '12px',
              borderRadius: '49px',
            }
            </script>

            <template>
              <button :style="buttonStyle" />
            </template>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'staticPxInlineStyle' }],
        },
        {
          code: `
            <template>
              <img :style="{ width: '24px', height: '24px' }" />
            </template>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'staticPxInlineStyle' }],
        },
        {
          code: `
            <template>
              <button :style="{ width: compact ? '32px' : '44px', height: \`${'${buttonHeight}'}px\` }" />
            </template>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'staticPxInlineStyle' }],
        },
      ],
    })
  })

  it('支持数组 style 绑定和路径忽略', () => {
    ruleTester.run('project-style/no-static-px-inline-style-options', noStaticPxInlineStyle, {
      valid: [
        {
          code: `
            <script setup>
            const iconStyle = { width: '24px' }
            </script>

            <template>
              <img :style="iconStyle" />
            </template>
          `,
          filename: 'app/components/message/MessageCard.vue',
          options: [{ ignoredPathPatterns: ['^app/components/message/'] }],
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: `
            <script setup>
            const iconStyle = { width: '24px' }
            </script>

            <template>
              <img :style="[dynamicStyle, iconStyle]" />
            </template>
          `,
          filename: 'app/components/common/ProfileCard/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'staticPxInlineStyle' }],
        },
      ],
    })
  })
})
