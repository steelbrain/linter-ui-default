const { download, extract } = require('gitly')
const { dirname, join } = require('path')
const { shx } = require('shx/lib/shx')
const { tmpdir } = require('os')

;(async function main() {
  const source = await download('steelbrain/linter')
  const root = dirname(__dirname)
  const distFolder = join(root, 'lib', 'types', 'linter')
  shx(['', '', 'rm', '-rf', distFolder])
  // shx([, , "mkdir", "-p", distFolder])

  const extractFolder = join(tmpdir(), 'linter')
  shx(['', '', 'mkdir', '-p', extractFolder])
  await extract(source, extractFolder)

  shx(['', '', 'mv', join(extractFolder, 'dist'), distFolder])
  shx(['', '', 'rm', '-rf', extractFolder])

  // avoid circular types
  shx(['', '', 'rm', '-rf', join(distFolder, 'types', 'linter-ui-default')])
  shx([
    '',
    '',
    'sed',
    '-i',
    './linter-ui-default/main',
    '../../../main',
    join(distFolder, 'types', 'linter-ui-default.d.ts'),
  ])
})()
