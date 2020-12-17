/* @flow */
import Benchmark from 'benchmark'
import { Chance } from 'chance'
const chance = new Chance()
import type { Message } from '../lib/types.d'
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
  let parLengths: number[] = new Array(numParagraphs)
  for (let i = 0; i < numParagraphs; i++) {
    const par = chance.paragraph({ sentences: numSentences })
    str = str.concat(par, '\n')
    parLengths[i] = par.length
  }
  await writeFile(filePath, str)
  return { fileLegth: str.length, parLengths }
}

