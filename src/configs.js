import { ruleGroups, rules } from './rules/index.js'

const namespace = '@sheng'

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

  return configs
}
