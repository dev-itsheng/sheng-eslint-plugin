# @sheng/prefer-to-refs-props

提醒组件脚本里不要直接读取 props.xxx 或 toRef(props, key)，统一先 toRefs(props)。

完整规则文档见 `../../../docs/rules/prefer-to-refs-props.md`。

内置 config：`project-style`。
