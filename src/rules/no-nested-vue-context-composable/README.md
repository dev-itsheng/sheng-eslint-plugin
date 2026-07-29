# @sheng/no-nested-vue-context-composable

限制依赖当前 Vue/Nuxt 上下文的 API 只能在 setup 或 use*.ts composable 主函数顶层同步调用。

完整规则文档见 `../../../docs/rules/no-nested-vue-context-composable.md`。

内置 config：`composable-boundary`。
