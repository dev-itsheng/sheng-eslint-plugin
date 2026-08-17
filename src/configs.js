import { rules } from './rules/index.js'
import { ruleGroups } from './rules/groups.js'

const namespace = '@sheng'
const legacyRuleGroups = {
  'nuxt-client-only-source': ruleGroups['nuxt-ssr-state'],
  'project-style': [
    ...ruleGroups.i18n,
    ...ruleGroups['component-resource-style'],
    ...ruleGroups['vue-reactivity'],
    ...ruleGroups['type-readability'],
  ],
}

function createRulesConfig(ruleNames) {
  return Object.fromEntries(ruleNames.map(ruleName => [`${namespace}/${ruleName}`, 'warn']))
}

function createConfig(plugin, name, ruleNames) {
  return {
    name: `@sheng/eslint-plugin/${name}`,
    plugins: {
      [namespace]: plugin,
    },
    rules: createRulesConfig(ruleNames),
  }
}

export function createConfigs(plugin) {
  const configs = {}
  const allRuleNames = Object.keys(rules)

  configs.all = createConfig(plugin, 'all', allRuleNames)

  for (const [groupName, ruleNames] of Object.entries(ruleGroups)) {
    configs[groupName] = createConfig(plugin, groupName, ruleNames)
  }

  for (const [groupName, ruleNames] of Object.entries(legacyRuleGroups)) {
    configs[groupName] = createConfig(plugin, groupName, ruleNames)
  }

  return configs
}
