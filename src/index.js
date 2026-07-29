import { createConfigs } from './configs.js'
import { rules } from './rules/index.js'

const plugin = {
  meta: {
    name: '@sheng/eslint-plugin',
    version: '0.1.0',
    namespace: '@sheng',
  },
  rules,
  configs: {},
  processors: {},
}

plugin.configs = createConfigs(plugin)

export const configs = plugin.configs
export { rules }
export default plugin
