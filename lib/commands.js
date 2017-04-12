/* @flow */

import { CompositeDisposable } from 'atom'

import { $file, $range, visitMessage, sortMessages, sortSolutions, filterMessages, applySolution } from './helpers'
import type { LinterMessage } from './types'

class Commands {
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linter-ui-default:next': () => this.move(true, true),
      'linter-ui-default:previous': () => this.move(false, true),
      'linter-ui-default:next-error': () => this.move(true, true, 'error'),
      'linter-ui-default:previous-error': () => this.move(false, true, 'error'),
      'linter-ui-default:next-warning': () => this.move(true, true, 'warning'),
      'linter-ui-default:previous-warning': () => this.move(false, true, 'warning'),
      'linter-ui-default:next-info': () => this.move(true, true, 'info'),
      'linter-ui-default:previous-info': () => this.move(false, true, 'info'),

      'linter-ui-default:next-in-current-file': () => this.move(true, false),
      'linter-ui-default:previous-in-current-file': () => this.move(false, false),
      'linter-ui-default:next-error-in-current-file': () => this.move(true, false, 'error'),
      'linter-ui-default:previous-error-in-current-file': () => this.move(false, false, 'error'),
      'linter-ui-default:next-warning-in-current-file': () => this.move(true, false, 'warning'),
      'linter-ui-default:previous-warning-in-current-file': () => this.move(false, false, 'warning'),
      'linter-ui-default:next-info-in-current-file': () => this.move(true, false, 'info'),
      'linter-ui-default:previous-info-in-current-file': () => this.move(false, false, 'info'),

      'linter-ui-default:toggle-panel': () => this.togglePanel(),

      // NOTE: Add no-ops here so they are recognized by commands registry
      // Real commands are registered when tooltip is shown inside tooltip's delegate
      'linter-ui-default:expand-tooltip': function() { },
      'linter-ui-default:collapse-tooltip': function() { },
    }))
    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'linter-ui-default:apply-all-solutions': () => this.applyAllSolutions(),
    }))
    this.subscriptions.add(atom.commands.add('#linter-panel', {
      'core:copy': () => {
        const selection = document.getSelection()
        if (selection) {
          atom.clipboard.write(selection.toString())
        }
      },
    }))
  }
  togglePanel(): void {
    atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'))
  }
  // NOTE: Apply solutions from bottom to top, so they don't invalidate each other
  applyAllSolutions(): void {
    const textEditor = atom.workspace.getActiveTextEditor()
    const messages = sortMessages([{ column: 'line', type: 'desc' }], filterMessages(this.messages, textEditor.getPath()))
    messages.forEach(function(message) {
      if (message.version === 1 && message.fix) {
        applySolution(textEditor, 1, message.fix)
      } else if (message.version === 2 && message.solutions && message.solutions.length) {
        applySolution(textEditor, 2, sortSolutions(message.solutions)[0])
      }
    })
  }
  move(forward: boolean, globally: boolean, severity: ?string = null): void {
    const currentEditor = atom.workspace.getActiveTextEditor()
    const currentFile: any = (currentEditor && currentEditor.getPath()) || NaN
    // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages
    const messages = sortMessages([{ column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }], filterMessages(this.messages, globally ? null : currentFile, severity))
    const expectedValue = forward ? -1 : 1

    if (!currentEditor) {
      const message = forward ? messages[0] : messages[messages.length - 1]
      if (message) {
        visitMessage(message)
      }
      return
    }
    const currentPosition = currentEditor.getCursorBufferPosition()

    // NOTE: Iterate bottom to top to find the previous message
    // Because if we search top to bottom when sorted, first item will always
    // be the smallest
    if (!forward) {
      messages.reverse()
    }

    let found
    let currentFileEncountered = false
    for (let i = 0, length = messages.length; i < length; i++) {
      const message = messages[i]
      const messageFile = $file(message)
      const messageRange = $range(message)

      if (!currentFileEncountered && messageFile === currentFile) {
        currentFileEncountered = true
      }
      if (messageFile && messageRange) {
        if (currentFileEncountered && messageFile !== currentFile) {
          found = message
          break
        } else if (messageFile === currentFile && currentPosition.compare(messageRange.start) === expectedValue) {
          found = message
          break
        }
      }
    }

    if (!found && messages.length) {
      // Reset back to first or last depending on direction
      found = messages[0]
    }

    if (found) {
      visitMessage(found)
    }
  }
  update(messages: Array<LinterMessage>) {
    this.messages = messages
  }
  dispose(): void {
    this.subscriptions.dispose()
  }
}

module.exports = Commands
