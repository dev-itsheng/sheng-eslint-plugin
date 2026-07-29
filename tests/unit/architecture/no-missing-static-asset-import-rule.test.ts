import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RuleTester } from 'eslint'
import { afterEach, describe, it } from 'vitest'
import noMissingStaticAssetImport from '../../../src/rules/no-missing-static-asset-import/index.mjs'

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTester = new RuleTester()
const tempDirs: string[] = []

async function createTempProject() {
  const root = await mkdtemp(join(tmpdir(), 'project-static-asset-import-'))
  tempDirs.push(root)
  await mkdir(join(root, 'app/components/Demo/assets'), { recursive: true })
  await mkdir(join(root, 'app/assets'), { recursive: true })
  await writeFile(join(root, 'app/components/Demo/assets/icon.svg'), '<svg />')
  await writeFile(join(root, 'app/assets/banner.webp'), 'webp')
  return root
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('no-missing-static-asset-import ESLint 规则', () => {
  it('检查相对路径和 alias 静态资源 import 是否真实存在', async () => {
    const root = await createTempProject()
    const filename = join(root, 'app/components/Demo/index.ts')

    ruleTester.run('project-style/no-missing-static-asset-import', noMissingStaticAssetImport, {
      valid: [
        {
          code: "import icon from './assets/icon.svg'",
          filename,
        },
        {
          code: "import banner from '@/assets/banner.webp?url'",
          filename,
          options: [{ aliases: [{ prefix: '@/', target: join(root, 'app') }] }],
        },
        {
          code: "import helper from './helper'",
          filename,
        },
      ],
      invalid: [
        {
          code: "import missingIcon from './assets/missing.svg'",
          filename,
          errors: [{ messageId: 'missingAsset' }],
        },
        {
          code: "import banner from '@/assets/missing.webp'",
          filename,
          options: [{ aliases: [{ prefix: '@/', target: join(root, 'app') }] }],
          errors: [{ messageId: 'missingAsset' }],
        },
      ],
    })
  })
})
