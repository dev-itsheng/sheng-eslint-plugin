import { getRuleFilename, toPosixPath } from '../utils/eslint-rule-context.mjs'

const DEFAULT_DIRECTORY_PATTERN = /\/(?:composables|global-composables)\//
const COMPOSABLE_FILE_PATTERN = /^use[A-Z].*\.[cm]?[jt]s$/

function shouldCheckFile(context) {
  const normalizedFilename = toPosixPath(getRuleFilename(context))
  const basename = normalizedFilename.split('/').pop() ?? ''

  return COMPOSABLE_FILE_PATTERN.test(basename) && DEFAULT_DIRECTORY_PATTERN.test(normalizedFilename)
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'use*.ts composable 文件只允许默认导出主 composable。',
    },
    messages: {
      noExportAll: 'use*.ts composable 文件不要重新导出其他模块；请改由目录 barrel 控制公开面。',
      noNamedExport: 'use*.ts composable 文件只导出默认 composable；类型、枚举和常量请移到同目录 types.ts / utils.ts / constants.ts。',
    },
    schema: [],
  },
  create(context) {
    if (!shouldCheckFile(context)) return {}

    return {
      ExportAllDeclaration(node) {
        context.report({
          node,
          messageId: 'noExportAll',
        })
      },
      ExportNamedDeclaration(node) {
        context.report({
          node,
          messageId: 'noNamedExport',
        })
      },
    }
  },
}
