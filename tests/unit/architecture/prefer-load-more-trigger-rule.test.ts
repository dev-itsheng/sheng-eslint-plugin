import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'
import { describe, it } from 'vitest'
import preferLoadMoreTrigger from '../../../src/rules/prefer-load-more-trigger/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()

describe('prefer-load-more-trigger ESLint 规则', () => {
  it('只提示疑似无限滚动的 useIntersectionObserver，不拦普通曝光/懒加载', () => {
    ruleTester.run('load-more-trigger/prefer-load-more-trigger', preferLoadMoreTrigger, {
      valid: [
        {
          code: `
            import { useIntersectionObserver } from '@vueuse/core'

            const cardElement = shallowRef(null)
            useIntersectionObserver(cardElement, ([entry]) => {
              if (entry?.isIntersecting) reportExposure()
            })
          `,
          filename: 'app/components/feed/UserCard/index.vue',
        },
        {
          code: `
            import { useIntersectionObserver } from '@vueuse/core'

            const sentinelElement = shallowRef(null)
            function loadMoreRooms() {}
          `,
          filename: 'app/components/legacy/RoomList/index.vue',
          options: [{ ignoredPathPatterns: ['^app/components/legacy/'] }],
        },
      ],
      invalid: [
        {
          code: `
            import { useIntersectionObserver } from '@vueuse/core'

            const sentinelElement = shallowRef(null)
            const hasMore = computed(() => true)
            function loadMore() {}
            useIntersectionObserver(sentinelElement, ([entry]) => {
              if (entry?.isIntersecting && hasMore.value) loadMore()
            })
          `,
          filename: 'app/components/feed/FeedSection/index.vue',
          errors: [{ messageId: 'preferLoadMoreTrigger' }],
        },
      ],
    })
  })

  it('覆盖 Vue SFC script setup 里的手写无限滚动 observer', () => {
    ruleTester.run('load-more-trigger/prefer-load-more-trigger-vue', preferLoadMoreTrigger, {
      valid: [
        {
          code: `
            <script setup lang="ts">
            import { useIntersectionObserver } from '@vueuse/core'

            const lazyImageElement = shallowRef<HTMLElement | null>(null)
            useIntersectionObserver(lazyImageElement, ([entry]) => {
              if (entry?.isIntersecting) loadImage()
            })
            </script>
          `,
          filename: 'app/components/common/LazyImage/index.vue',
          languageOptions: {
            parser: vueParser,
          },
        },
      ],
      invalid: [
        {
          code: `
            <script setup lang="ts">
            import { useIntersectionObserver } from '@vueuse/core'

            const loadMoreSentinelElement = shallowRef<HTMLElement | null>(null)
            const nextIndex = ref(20)
            function loadMoreActiveTab() {}
            useIntersectionObserver(loadMoreSentinelElement, ([entry]) => {
              if (entry?.isIntersecting && nextIndex.value > 0) loadMoreActiveTab()
            })
            </script>
          `,
          filename: 'app/components/common/VirtualFeed/index.vue',
          languageOptions: {
            parser: vueParser,
          },
          errors: [{ messageId: 'preferLoadMoreTrigger' }],
        },
      ],
    })
  })
})
