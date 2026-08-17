# @sheng/no-component-name-conflict

避免 Vue <script setup> 中组件 tag 或自定义指令名和顶层绑定只靠大小写区分，导致模板解析到错误对象。

完整规则文档见 `../../../docs/rules/no-component-name-conflict.md`。

内置 config：`vue-script-setup`。包内默认以 `warn` 开启；业务项目确认 parser 配置正常后，建议覆写成 `error`。
