/* @flow */

import { $range, applySolution, filterMessagesByPath } from './helpers'
import type { LinterMessage } from './types'

export default class Intentions {
  messages: Array<LinterMessage>;
  grammarScopes: Array<string>;

  constructor() {
    this.messages = []
    this.grammarScopes = ['*']
  }
  getIntentions({ textEditor, bufferPosition }: Object): Array<Object> {
    const messages = filterMessagesByPath(this.messages, textEditor.getPath())
    const toReturn = []

    for (const message of messages) {
      const hasFixes = message.version === 1 ? message.fix : message.solutions && message.solutions.length
      if (!hasFixes) {
        continue
      }
      const range = $range(message)
      const inRange = range && range.containsPoint(bufferPosition)
      if (!inRange) {
        continue
      }

      let solutions = []
      if (message.version === 1 && message.fix) {
        solutions.push(message.fix)
      } else if (message.version === 2 && message.solutions && message.solutions.length) {
        solutions = message.solutions
      }
      const linterName = message.linterName || 'Linter'

      for (const solution of (solutions: Array<Object>)) {
        toReturn.push({
          priority: solution.priority ? solution.priority + 200 : 200,
          icon: 'tools',
          title: solution.title || `Fix ${linterName} issue`,
          selected() {
            applySolution(textEditor, message.version, solution)
          },
        })
      }
    }
    return toReturn
  }
  update(messages: Array<LinterMessage>) {
    this.messages = messages
  }
}
