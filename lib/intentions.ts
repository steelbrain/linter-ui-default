import { $range, applySolution, filterMessages } from './helpers'
import type { LinterMessage, ListItem, MessageSolution } from './types'
import type { TextEditor, Point } from 'atom'

export default class Intentions {
  messages: Array<LinterMessage> = []
  grammarScopes: Array<string> = ['*']

  getIntentions({ textEditor, bufferPosition }: { textEditor: TextEditor; bufferPosition: Point }) {
    let intentions: ListItem[] = []
    const messages = filterMessages(this.messages, textEditor.getPath())

    for (const message of messages) {
      const messageSolutions = message.solutions
      const hasArrayFixes = Array.isArray(messageSolutions) && messageSolutions.length > 0
      if (!hasArrayFixes && typeof messageSolutions !== 'function') {
        // if it doesn't have solutions then continue
        continue
      }
      const range = $range(message)
      if (range?.containsPoint(bufferPosition) !== true) {
        // if not in range then continue
        continue
      }

      const linterName = message.linterName || 'Linter'

      if (message.version === 2) {
        if (hasArrayFixes) {
          intentions = intentions.concat(
            (messageSolutions as MessageSolution[]).map(solution => ({
              priority: typeof solution.priority === 'number' ? solution.priority + 200 : 200,
              icon: 'tools',
              title: solution.title ?? `Fix ${linterName} issue`,
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
