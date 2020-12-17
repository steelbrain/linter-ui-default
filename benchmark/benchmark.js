/* @flow */
import { Chance } from 'chance'
const chance = new Chance()
import type { Message } from '../lib/types.d'
import type { Range } from 'atom'


function getRanomPoint(maxNum: number) {
  return [chance.integer({ min: 0, max: maxNum }), chance.integer({ min: 0, max: maxNum })].sort()
}

function getRandomRange(maxNum: number) {
  return new Range(getRanomPoint(maxNum), getRanomPoint(maxNum))
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

