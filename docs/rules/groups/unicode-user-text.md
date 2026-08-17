# Unicode 用户文本

这组规则适合有昵称、签名、备注、搜索词、举报原因、输入框计数或文本截断需求的产品。它关注的是用户眼里的“一个字”，不是 JavaScript 字符串的 UTF-16 code unit。

## 适用场景

JavaScript 的 `String.length`、`slice()`、`substring()` 等 API 按 UTF-16 code unit 工作。emoji、国旗、肤色修饰、ZWJ 组合、组合音标和复杂书写系统都可能被数错或切断。

项目只处理技术字符串时可以不启用这组规则；一旦这些字符串会展示给用户、限制输入长度或被截断展示，就应该用基于 grapheme cluster 的工具函数。

## 包含规则

| 规则 | 作用 |
| --- | --- |
| [`@sheng/no-native-string-user-text-ops`](../no-native-string-user-text-ops.md) | 禁止在用户可见文本里直接使用原生字符串长度或截断 API。 |

## 相关阅读

- [别再用 length 统计用户文本：一次 Unicode 字符数和 ESLint 护栏复盘](https://shengsheng.fun/2026/07/03/unicode-grapheme-text-count-eslint-guardrail/) 从 emoji、国旗、组合字符和 `Intl.Segmenter` 解释了为什么用户文本应该按 grapheme cluster 处理。
