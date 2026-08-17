# 规则

规则文档按内置 config 分组。每个规则页保留完整说明、接入片段、选项边界和维护入口；源码目录里的 README 只保留短入口，避免实现目录承担网站文档结构。

## [`vue-script-setup`](./groups/vue-script-setup.md)

Vue `<script setup>` 宏和模板名称解析边界。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-nested-define-props`](./no-nested-define-props.md) | 避免把 Vue `<script setup>` 的 `defineProps()` 包进普通运行时表达式，导致编译器宏没有被识别。 |
| [`@sheng/no-component-name-conflict`](./no-component-name-conflict.md) | 避免 Vue `<script setup>` 中组件 tag 或自定义指令名和顶层绑定只靠大小写区分，导致模板解析到错误对象。 |

## [`i18n`](./groups/i18n.md)

翻译 key、调用点 fallback 和用户可见中文文案约定。不涉及国际化的项目可以跳过这一组。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-dynamic-i18n-t-key`](./no-dynamic-i18n-t-key.md) | 要求 i18n 的 `t()` 第一个参数必须是字符串字面量，保证 IDE 插件和静态扫描能识别真实 key。 |
| [`@sheng/no-i18n-t-fallback`](./no-i18n-t-fallback.md) | 禁止在 i18n 翻译函数调用里传 fallback，避免缺失 key 被调用点静默掩盖。 |
| [`@sheng/no-chinese-user-text-literal`](./no-chinese-user-text-literal.md) | 扫描运行时代码里的中文字面量；用户可见中文应使用已有 i18n key，待补文案进入项目文案清单。 |

## [`unicode-user-text`](./groups/unicode-user-text.md)

用户可见文本的 Unicode 字符数和截断护栏。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-native-string-user-text-ops`](./no-native-string-user-text-ops.md) | 禁止在用户可见文本里直接使用原生字符串长度或截断 API，避免 UTF-16 code unit 计数和切片误伤 emoji、国旗和组合字符。 |

## [`nuxt-auto-import`](./groups/nuxt-auto-import.md)

Nuxt 组件和 Vue API 自动导入约定。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-explicit-vue-api-import`](./no-explicit-vue-api-import.md) | 提示 Vue 运行时 API 在 Nuxt SFC / app 代码里应使用自动导入，类型 import 仍允许显式保留。 |
| [`@sheng/no-explicit-vue-component-import`](./no-explicit-vue-component-import.md) | 提示 Nuxt 组件应使用自动导入名，避免在组件和页面里显式 import .vue 组件。 |

## [`enum-public-api`](./groups/enum-public-api.md)

公开字符串调用面里的 enum 使用边界。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-enum-prop-type`](./no-enum-prop-type.md) | 提醒少数需要 string-compatible 调用面的 Vue props 不要直接暴露指定 enum 类型。 |
| [`@sheng/no-template-enum-member-alias`](./no-template-enum-member-alias.md) | 提示 Vue template 可以直接使用 `<script setup>` 里的 enum member，不需要额外声明一比一中转常量。 |

## [`nuxt-ssr-state`](./groups/nuxt-ssr-state.md)

Nuxt 模块级 SSR 不安全状态边界。旧配置名 `nuxt-client-only-source` 仍保留为兼容别名。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-ssr-unsafe-module-state`](./no-ssr-unsafe-module-state.md) | 提醒 Nuxt use* composable 里的模块级可变状态必须显式声明 SSR 策略。 |

## [`composable-boundary`](./groups/composable-boundary.md)

Composable 公开面、私有模块和 UI 层依赖边界。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-extra-composable-exports`](./no-extra-composable-exports.md) | `use*.ts` composable 文件只允许默认导出主 composable。 |
| [`@sheng/no-flat-private-child-module`](./no-flat-private-child-module.md) | 提示只有单一父调用方的私有 composable 或 component 不要和父文件平铺在同一个目录。 |
| [`@sheng/no-global-composable-import-ui-layer`](./no-global-composable-import-ui-layer.md) | 禁止全局 composable 反向 import UI 层。 |
| [`@sheng/no-global-composable-pass-through`](./no-global-composable-pass-through.md) | 提醒不要把全局 composable 返回值原样透传给组件或页面私有 composable。 |
| [`@sheng/no-nested-vue-context-composable`](./no-nested-vue-context-composable.md) | 限制依赖当前 Vue/Nuxt 上下文的 API 只能在 setup 或 use*.ts composable 主函数顶层同步调用。 |

## [`component-resource-style`](./groups/component-resource-style.md)

组件 DOM owner、静态样式和静态资源 import 的项目约定。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-dom-query-in-component`](./no-dom-query-in-component.md) | 提示组件和页面不要用 DOM 查找 API，优先使用 template ref 或 function ref。 |
| [`@sheng/no-missing-static-asset-import`](./no-missing-static-asset-import.md) | 检查静态资源 import 的目标文件是否真实存在，避免 dev/build 阶段才暴露缺文件。 |
| [`@sheng/no-static-px-inline-style`](./no-static-px-inline-style.md) | 提示 Vue 组件不要把固定 px 样式写成 `:style` 绑定对象。 |

## [`vue-reactivity`](./groups/vue-reactivity.md)

Vue watch、props 读取形态这类响应式代码约定。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-redundant-watch-source-compare`](./no-redundant-watch-source-compare.md) | 禁止在单 source watch 回调中冗余比较 next value 和 previous value。 |
| [`@sheng/prefer-to-refs-props`](./prefer-to-refs-props.md) | 提醒组件脚本里不要直接读取 `props.xxx` 或 `toRef(props, key)`，统一先 `toRefs(props)`。 |

## [`type-readability`](./groups/type-readability.md)

TypeScript 运行时值、映射表和轻量 computed 的可读性约定。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-type-import-used-as-value`](./no-type-import-used-as-value.md) | 提示 type-only import 不能在运行时表达式里当值使用。 |
| [`@sheng/no-redundant-indexed-record-satisfies`](./no-redundant-indexed-record-satisfies.md) | 提示完整 `Record` 映射表被立即索引时去掉冗余 `satisfies`。 |
| [`@sheng/prefer-keyed-object-map`](./prefer-keyed-object-map.md) | 提醒同一个离散 key 的分支优先改成对象字面量加 key 映射。 |
| [`@sheng/prefer-inline-single-use-map`](./prefer-inline-single-use-map.md) | 提示只被索引读取一次的对象 / 数组映射表直接内联到使用处。 |
| [`@sheng/prefer-inline-trivial-computed`](./prefer-inline-trivial-computed.md) | 提示不要用 computed 只包一层静态 i18n 调用或简单模板 class map。 |

## [`load-more-trigger`](./groups/load-more-trigger.md)

无限滚动触底触发器复用约定。

| 规则 | 作用 |
| --- | --- |
| [`@sheng/prefer-load-more-trigger`](./prefer-load-more-trigger.md) | 提示疑似无限滚动场景不要手写 IntersectionObserver，优先使用 useLoadMoreTrigger。 |
