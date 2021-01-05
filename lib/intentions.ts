import { $range, applySolution, filterMessages } from './helpers'
import type { LinterMessage, ListItem } from './types'
import type { TextEditor, Point } from 'atom'

export default class Intentions {
  messages: Array<LinterMessage> = []
  grammarScopes: Array<string> = ['*']

  getIntentions({ textEditor, bufferPosition }: { textEditor: TextEditor; bufferPosition: Point }) {
    let intentions: ListItem[] = []
    const messages = filterMessages(this.messages, textEditor.getPath())

    for (const message of messages) {
      const hasFixes = message.solutions && message.solutions.length
      if (!hasFixes) {
        continue
      }
      const range = $range(message)
      const inRange = range && range.containsPoint(bufferPosition)
      if (!inRange) {
        continue
      }

      const linterName = message.linterName || 'Linter'

      const messageSolutions = message.solutions
      if (message.version === 2) {
        if (Array.isArray(messageSolutions) && messageSolutions.length !== 0) {
          const solutions = messageSolutions
          intentions = intentions.concat(
            solutions.map(solution => ({
              priority: solution.priority ? solution.priority + 200 : 200,
              icon: 'tools',
              title: solution.title || `Fix ${linterName} issue`,
              selected() {
                applySolution(textEditor, solution)
              },
            })),
          )
        }
      }
    }
    return intentions
  }
  update(messages: Array<LinterMessage>) {
    this.messages = messages
  }
}
