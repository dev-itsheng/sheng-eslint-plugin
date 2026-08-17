import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import RuleDemo from './components/RuleDemo.vue'
import './style.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp(context) {
    context.app.component('RuleDemo', RuleDemo)
  },
}

export default theme
