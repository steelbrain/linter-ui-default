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
  severity: ?string = chance.pickone(['error', 'warning', 'info']),
  range: ?Range = getRandomRange(),
): Message {
  return {
    key: chance.unique(chance.string),
    version: 2,
    severity,
    excerpt: String(chance.integer()),
    location: { file: filePath, position: range },
    description: chance.string({ length: 100 }),
  }
}

