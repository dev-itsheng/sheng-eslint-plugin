import noNestedDefineProps from './no-nested-define-props/index.mjs'
import noComponentNameConflict from './no-component-name-conflict/index.mjs'
import noNativeStringUserTextOps from './no-native-string-user-text-ops/index.mjs'
import noExplicitVueApiImport from './no-explicit-vue-api-import/index.mjs'
import noExplicitVueComponentImport from './no-explicit-vue-component-import/index.mjs'
import noEnumPropType from './no-enum-prop-type/index.mjs'
import noTemplateEnumMemberAlias from './no-template-enum-member-alias/index.mjs'
import noSsrUnsafeModuleState from './no-ssr-unsafe-module-state/index.mjs'
import noExtraComposableExports from './no-extra-composable-exports/index.mjs'
import noFlatPrivateChildModule from './no-flat-private-child-module/index.mjs'
import noGlobalComposableImportUiLayer from './no-global-composable-import-ui-layer/index.mjs'
import noGlobalComposablePassThrough from './no-global-composable-pass-through/index.mjs'
import noNestedVueContextComposable from './no-nested-vue-context-composable/index.mjs'
import noChineseUserTextLiteral from './no-chinese-user-text-literal/index.mjs'
import noDomQueryInComponent from './no-dom-query-in-component/index.mjs'
import noDynamicI18nTKey from './no-dynamic-i18n-t-key/index.mjs'
import noI18nTFallback from './no-i18n-t-fallback/index.mjs'
import noMissingStaticAssetImport from './no-missing-static-asset-import/index.mjs'
import noRedundantIndexedRecordSatisfies from './no-redundant-indexed-record-satisfies/index.mjs'
import noRedundantWatchSourceCompare from './no-redundant-watch-source-compare/index.mjs'
import noStaticPxInlineStyle from './no-static-px-inline-style/index.mjs'
import noTypeImportUsedAsValue from './no-type-import-used-as-value/index.mjs'
import preferInlineSingleUseMap from './prefer-inline-single-use-map/index.mjs'
import preferInlineTrivialComputed from './prefer-inline-trivial-computed/index.mjs'
import preferKeyedObjectMap from './prefer-keyed-object-map/index.mjs'
import preferToRefsProps from './prefer-to-refs-props/index.mjs'
import preferLoadMoreTrigger from './prefer-load-more-trigger/index.mjs'
export { ruleGroups } from './groups.js'

export const rules = {
  'no-nested-define-props': noNestedDefineProps,
  'no-component-name-conflict': noComponentNameConflict,
  'no-native-string-user-text-ops': noNativeStringUserTextOps,
  'no-explicit-vue-api-import': noExplicitVueApiImport,
  'no-explicit-vue-component-import': noExplicitVueComponentImport,
  'no-enum-prop-type': noEnumPropType,
  'no-template-enum-member-alias': noTemplateEnumMemberAlias,
  'no-ssr-unsafe-module-state': noSsrUnsafeModuleState,
  'no-extra-composable-exports': noExtraComposableExports,
  'no-flat-private-child-module': noFlatPrivateChildModule,
  'no-global-composable-import-ui-layer': noGlobalComposableImportUiLayer,
  'no-global-composable-pass-through': noGlobalComposablePassThrough,
  'no-nested-vue-context-composable': noNestedVueContextComposable,
  'no-chinese-user-text-literal': noChineseUserTextLiteral,
  'no-dom-query-in-component': noDomQueryInComponent,
  'no-dynamic-i18n-t-key': noDynamicI18nTKey,
  'no-i18n-t-fallback': noI18nTFallback,
  'no-missing-static-asset-import': noMissingStaticAssetImport,
  'no-redundant-indexed-record-satisfies': noRedundantIndexedRecordSatisfies,
  'no-redundant-watch-source-compare': noRedundantWatchSourceCompare,
  'no-static-px-inline-style': noStaticPxInlineStyle,
  'no-type-import-used-as-value': noTypeImportUsedAsValue,
  'prefer-inline-single-use-map': preferInlineSingleUseMap,
  'prefer-inline-trivial-computed': preferInlineTrivialComputed,
  'prefer-keyed-object-map': preferKeyedObjectMap,
  'prefer-to-refs-props': preferToRefsProps,
  'prefer-load-more-trigger': preferLoadMoreTrigger,
}
