export type RuleDemoExample = {
  code: string
  filename: string
  language: 'javascript' | 'typescript' | 'vue'
}

export type RuleDemo = {
  examples: RuleDemoExample[]
}

export const ruleDemos: Record<string, RuleDemo> = {
  'no-component-name-conflict': {
    examples: [
      {
        filename: 'app/components/common/Profile/Popup.vue',
        language: 'vue',
        code: `<template>
  <popup-status :message="popupStatus.message" />
</template>

<script setup lang="ts">
import { PopupStatus } from './components'

const popupStatus = {
  message: 'Saved',
}
</script>
`,
      },
      {
        filename: 'app/components/common/Profile/Input.vue',
        language: 'vue',
        code: `<template>
  <input v-popup-status />
</template>

<script setup lang="ts">
import { VPopupStatus } from './directives'

const vPopupStatus = {
  mounted() {},
}
</script>
`,
      },
    ],
  },
  'no-nested-define-props': {
    examples: [
      {
        filename: 'app/components/common/Profile/Card.vue',
        language: 'vue',
        code: `<script setup lang="ts">
import { toRefs } from 'vue'

interface Props {
  level: number
}

const { level } = toRefs(defineProps<Props>())
</script>
`,
      },
    ],
  },
  'no-dynamic-i18n-t-key': {
    examples: [
      {
        filename: 'app/components/common/Profile/Title.vue',
        language: 'vue',
        code: `<script setup lang="ts">
const title = t(\`profile_\${section.value}_title\`)
</script>
`,
      },
    ],
  },
  'no-i18n-t-fallback': {
    examples: [
      {
        filename: 'app/components/common/Profile/SaveButton.vue',
        language: 'vue',
        code: `<script setup lang="ts">
const buttonText = t('profile_save', { fallback: '保存' })
</script>
`,
      },
    ],
  },
  'no-chinese-user-text-literal': {
    examples: [
      {
        filename: 'app/components/common/Profile/EmptyState.vue',
        language: 'vue',
        code: `<!-- 中文注释允许保留 -->
<script setup lang="ts">
const emptyText = '暂无数据'
</script>

<template>
  <p>暂无数据</p>
</template>
`,
      },
    ],
  },
  'no-dom-query-in-component': {
    examples: [
      {
        filename: 'app/components/common/Profile/Card.vue',
        language: 'vue',
        code: `<script setup lang="ts">
const rootRef = shallowRef<HTMLElement | null>(null)

function focusActiveItem() {
  rootRef.value?.querySelector('[data-active]')?.scrollIntoView()
}
</script>
`,
      },
    ],
  },
  'no-static-px-inline-style': {
    examples: [
      {
        filename: 'app/components/common/Profile/Card.vue',
        language: 'vue',
        code: `<script setup lang="ts">
const buttonStyle = {
  width: '44px',
  height: '44px',
}
</script>

<template>
  <button :style="buttonStyle">Focus</button>
</template>
`,
      },
    ],
  },
  'no-missing-static-asset-import': {
    examples: [
      {
        filename: 'app/components/common/Profile/EmptyState.vue',
        language: 'vue',
        code: `<script setup lang="ts">
import emptyIcon from './assets/missing-empty-state.svg'
</script>

<template>
  <img :src="emptyIcon" alt="" />
</template>
`,
      },
    ],
  },
  'no-redundant-watch-source-compare': {
    examples: [
      {
        filename: 'app/components/common/Profile/Tabs.vue',
        language: 'vue',
        code: `<script setup lang="ts">
watch(activeTab, (nextTab, previousTab) => {
  if (nextTab === previousTab) return
  refreshTab(nextTab)
})
</script>
`,
      },
    ],
  },
  'no-type-import-used-as-value': {
    examples: [
      {
        filename: 'app/components/common/Profile/view-model.ts',
        language: 'typescript',
        code: `import type { AuthMode } from './types'

const isGuest = authMode.value === AuthMode.Guest
`,
      },
    ],
  },
  'prefer-keyed-object-map': {
    examples: [
      {
        filename: 'app/components/common/Profile/view-model.ts',
        language: 'typescript',
        code: `const label = status === Status.Ready ? 'Ready' : status === Status.Error ? 'Error' : 'Unknown'
`,
      },
    ],
  },
  'prefer-inline-single-use-map': {
    examples: [
      {
        filename: 'app/components/common/Profile/view-model.ts',
        language: 'typescript',
        code: `const iconByType = {
  coin: coinIcon,
  points: pointsIcon,
}
const icon = iconByType[type.value]
`,
      },
    ],
  },
  'prefer-inline-trivial-computed': {
    examples: [
      {
        filename: 'app/components/common/Profile/view-model.ts',
        language: 'typescript',
        code: `const titleText = computed(() => t('profile_title'))
`,
      },
    ],
  },
  'prefer-to-refs-props': {
    examples: [
      {
        filename: 'app/components/common/Profile/view-model.ts',
        language: 'typescript',
        code: `const props = defineProps<{ name: string }>()
const name = toRef(props, 'name')
const title = computed(() => props.name)
`,
      },
    ],
  },
  'no-redundant-indexed-record-satisfies': {
    examples: [
      {
        filename: 'app/components/common/Profile/view-model.ts',
        language: 'typescript',
        code: `const tabName = ({
  [DashboardTab.Overview]: 'overview',
  [DashboardTab.Billing]: 'billing',
} satisfies Record<DashboardTab, string>)[activeTab.value]
`,
      },
    ],
  },
  'no-explicit-vue-api-import': {
    examples: [
      {
        filename: 'app/components/common/Profile/Counter.vue',
        language: 'vue',
        code: `<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'

const count: Ref<number> = ref(0)
const doubled = computed(() => count.value * 2)
</script>
`,
      },
    ],
  },
  'no-ssr-unsafe-module-state': {
    examples: [
      {
        filename: 'app/composables/useProfileCache.ts',
        language: 'typescript',
        code: `const profileCache = ref(new Map<string, Profile>())

export function useProfileCache() {
  return profileCache
}
`,
      },
    ],
  },
}
