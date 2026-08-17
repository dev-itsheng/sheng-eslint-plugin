import { defineConfig, type DefaultTheme } from 'vitepress'
import { ruleGroupDetails, ruleGroups } from '../../src/rules/groups.js'

function createRuleItems(ruleNames: string[]) {
  return ruleNames.map(ruleName => ({
    text: `@sheng/${ruleName}`,
    link: `/rules/${ruleName}`,
  }))
}

function createRulesSidebar(): DefaultTheme.SidebarItem[] {
  return Object.entries(ruleGroups).map(([groupName, ruleNames]) => ({
    text: ruleGroupDetails[groupName]?.label ?? groupName,
    link: `/rules/groups/${groupName}`,
    collapsed: groupName !== 'vue-script-setup',
    items: createRuleItems(ruleNames),
  }))
}

export default defineConfig({
  title: '@sheng/eslint-plugin',
  description: '从 shengsheng.fun 前端工程复盘中沉淀出来的 ESLint 规则。',
  base: process.env.VITEPRESS_BASE ?? '/sheng-eslint-plugin/',
  cleanUrls: true,
  lang: 'zh-CN',
  lastUpdated: true,
  vite: {
    build: {
      chunkSizeWarningLimit: 3500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('monaco-editor')) return 'monaco-editor'
          },
        },
      },
    },
  },
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide' },
      { text: '配置', link: '/configs' },
      { text: '规则', link: '/rules/' },
      { text: 'GitHub', link: 'https://github.com/dev-itsheng/sheng-eslint-plugin' },
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '首页', link: '/' },
          { text: '使用指南', link: '/guide' },
          { text: '配置', link: '/configs' },
        ],
      },
      {
        text: '规则',
        items: [
          { text: '规则列表', link: '/rules/' },
          ...createRulesSidebar(),
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonAriaLabel: '搜索文档',
            buttonText: '搜索',
          },
          modal: {
            backButtonTitle: '返回',
            displayDetails: '显示详情',
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除搜索',
            footer: {
              closeKeyAriaLabel: '关闭',
              closeText: '关闭',
              navigateDownKeyAriaLabel: '下移',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上移',
              selectKeyAriaLabel: '选择',
              selectText: '选择',
            },
          },
        },
      },
    },
    outline: {
      label: '本页内容',
      level: [2, 3],
    },
    editLink: {
      pattern: 'https://github.com/dev-itsheng/sheng-eslint-plugin/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: {
      text: '上次更新',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dev-itsheng/sheng-eslint-plugin' },
    ],
    footer: {
      message: '基于 MIT 协议发布。',
      copyright: 'Copyright © dev-itsheng',
    },
  },
})
