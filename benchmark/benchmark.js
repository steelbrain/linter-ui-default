/* @flow */
// eslint-disable-next-line import/no-unassigned-import
import 'module-alias/register'
import { Chance } from 'chance'
const chance = new Chance()
import type { Message } from '../lib/types'
import { Range } from 'atom'
import type { TextEditor } from 'atom'
import Editor from '../dist/editor'
import { writeFile as writeFileRaw } from 'fs'
import { promisify } from 'util'
const writeFile = promisify(writeFileRaw)

/* ************************************************************************* */

function getRanomPoint(parLengths: number[]): [number, number] {
  const randomRow = chance.integer({ min: 0, max: parLengths.length })
  const randomColumn = chance.integer({ min: 0, max: parLengths[randomRow] })
  return [randomRow, randomColumn]
}

function getRandomRange(parLengths: number[]) {
  const pointsSorted = [getRanomPoint(parLengths), getRanomPoint(parLengths)].sort((p1, p2) => {
    return p1[0] - p2[0]
  })
  return Range.fromObject(pointsSorted)
}

function generateRandomMessage(
  filePath: ?string,
  range: ?Range = getRandomRange(),
  severity: ?string = chance.pickone(['error', 'warning', 'info']),
): Message {
  return {
    key: chance.unique(chance.string, 1)[0],
    version: 2,
    severity,
    excerpt: String(chance.integer()),
    location: { file: filePath, position: range },
    description: chance.sentence({ words: 20 }),
  }
}

async function getTestFile(filePath: string, numParagraphs: number = 30, numSentences: number = 10) {
  let str: string = ''
  const parLengths: number[] = new Array(numParagraphs)
  for (let i = 0; i < numParagraphs; i++) {
    const par = chance.paragraph({ sentences: numSentences })
    str = str.concat(par, '\n')
    parLengths[i] = par.length
  }
  await writeFile(filePath, str)
  return { fileLegth: str.length, parLengths }
}

/* ************************************************************************* */

describe('Editor benchmark', function () {
  // parameters
  const numParagraphs = 300
  const numSentences = 10
  const filePath = './benchmark/benchmarkTestFile.txt'
  const messageNumlist = [5, 10, 20, 50, 70, 100, 200, 500, 800, 1000] // test for different number of messages

  let editor: Editor
  let textEditor: TextEditor
  let parLengths: number
  // let fileLength: number
  beforeEach(async function () {
    // make a test file
    const testFileProps = await getTestFile(filePath, numParagraphs, numSentences)
    parLengths = testFileProps.parLengths
    // fileLength = testFileProps.fileLength

    // open the test file
    await atom.workspace.open(filePath)

    // make a linter editor instance
    textEditor = atom.workspace.getActiveTextEditor()
    // Attache text editor
    jasmine.attachToDOM(textEditor.getElement())

    // create linter Editor instance
    editor = new Editor(textEditor)

    // Activate linter-ui-default
    atom.packages.triggerDeferredActivationHooks()
    atom.packages.triggerActivationHook('core:loaded-shell-environment')

    atom.packages.loadPackage('linter-ui-default')
  })

  it('applyChanges benchmark', function () {
    console.log('it adds the messages to the editor and then removes them')

    // test for different number of messages
    for (const messageNum of messageNumlist) {
      // get linter messages
      const messages = new Array(messageNum)
      for (let i = 0; i < messageNum; i++) {
        messages[i] = generateRandomMessage(filePath, getRandomRange(parLengths))
      }

      console.log(`\n number of messages are ${messageNum} \n`)

      // Add
      expect(textEditor.getBuffer().getMarkerCount()).toBe(0)

      const ti_add = window.performance.now()

      editor.applyChanges(messages, [])

      const tf_add = window.performance.now()

      expect(textEditor.getBuffer().getMarkerCount()).toBe(messageNum)
      console.log(
        `Adding ${messageNum} linter messages took ${' '.repeat(50 - messageNum.toString().length)} ${(
          tf_add - ti_add
        ).toFixed(3)} ms`,
      )

      // Remove
      const ti_remove = window.performance.now()

      editor.applyChanges([], messages)

      const tf_remove = window.performance.now()

      expect(textEditor.getBuffer().getMarkerCount()).toBe(0)
      console.log(
        `Removing ${messageNum} linter messages took ${' '.repeat(48 - messageNum.toString().length)} ${(
          tf_remove - ti_remove
        ).toFixed(3)} ms`,
      )
    }
  })

  afterEach(function () {
    editor.dispose()
    atom.workspace.destroyActivePaneItem()
  })
})
