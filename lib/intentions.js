/* @flow */

import { $range, applySolution, filterMessages } from './helpers'
import type { LinterMessage } from './types'

export default class Intentions {
  messages: Array<LinterMessage>;
  grammarScopes: Array<string>;

  constructor() {
    this.messages = []
    this.grammarScopes = ['*']
  }
  getIntentions({ textEditor, bufferPosition }: Object): Array<Object> {
    let intentions = []
    const messages = filterMessages(this.messages, textEditor.getPath())

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

      let solutions: Array<Object> = []
      if (message.version === 1 && message.fix) {
        solutions.push(message.fix)
      } else if (message.version === 2 && message.solutions && message.solutions.length) {
        solutions = message.solutions
      }
      const linterName = message.linterName || 'Linter'

      intentions = intentions.concat(solutions.map(solution => ({
        priority: solution.priority ? solution.priority + 200 : 200,
        icon: 'tools',
        title: solution.title || `Fix ${linterName} issue`,
        selected() {
          applySolution(textEditor, message.version, solution)
        },
      })))
    }
    return intentions
  }
  update(messages: Array<LinterMessage>) {
    this.messages = messages
  }
}
