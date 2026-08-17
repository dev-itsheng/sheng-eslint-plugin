# composable 边界

这组规则适合已经把 composable 当成项目结构约定的 Vue / Nuxt 项目。它守的是公开面、私有子模块和依赖方向，不适合在目录边界还没形成时一上来全仓设成 `error`。

## 适用场景

项目里的 composable 可以先分成四层：全局 source/action 层、页面或组件局部 composable、私有子模块，以及依赖 Vue / Nuxt 上下文的 API。每一层的 owner 不同，能 import 谁、能暴露什么、什么时候读取上下文能力，也应该不同。

这组规则建议先用 `warn` 观察。全局层和 UI 层依赖方向这类问题比较稳定，可以较早收紧；私有模块归属、单一默认导出这类规则，需要先确认历史代码的目录口径。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-extra-composable-exports`](../no-extra-composable-exports.md) | `use*.ts` composable 文件只允许默认导出主 composable。 |
| [`@sheng/no-flat-private-child-module`](../no-flat-private-child-module.md) | 提示只有单一父调用方的私有 composable / component 不要和父文件平铺在同一个目录。 |
| [`@sheng/no-global-composable-import-ui-layer`](../no-global-composable-import-ui-layer.md) | 禁止全局 composable 反向 import UI 层。 |
| [`@sheng/no-global-composable-pass-through`](../no-global-composable-pass-through.md) | 提醒不要把全局 composable 返回值原样透传给组件或页面私有 composable。 |
| [`@sheng/no-nested-vue-context-composable`](../no-nested-vue-context-composable.md) | 限制依赖当前 Vue / Nuxt 上下文的 API 只能在 setup 或 `use*.ts` composable 主函数顶层同步调用。 |

## 相关阅读

- [Composable 的公开面别靠默契：用 ESLint 守住私有模块边界](https://shengsheng.fun/2026/07/24/composable-module-boundary-eslint-guardrails/) 按四层边界解释了这些规则：全局 composable 不反向依赖 UI 层，局部 composable 自己读取上下文能力，`use*.ts` 只暴露主入口，私有子模块通过目录表达归属。
