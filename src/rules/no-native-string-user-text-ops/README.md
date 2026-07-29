# @sheng/no-native-string-user-text-ops

禁止在用户可见文本里直接使用原生字符串长度 / 截断 API，避免 UTF-16 code unit 计数和切片误伤 emoji、国旗和组合字符。

完整规则文档见 `../../../docs/rules/no-native-string-user-text-ops.md`。

内置 config：`unicode-user-text`。
