/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'

import { $file, $range, visitMessage, sortMessages } from './helpers'
import type { LinterMessage } from './types'

export default class Commands {
  emitter: Emitter;
  subscriptions: CompositeDisposable;

  constructor() {
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'linter-ui-default:next-error': () => this.move(true),
      'linter-ui-default:previous-error': () => this.move(),
      'linter-ui-default:toggle-panel': () => this.togglePanel(),
    }))
  }
  togglePanel(): void {
    atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'))
  }
  move(forward: boolean = false) {
    const messages = sortMessages([{ column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }], this.requestMessages())
    const textEditor = atom.workspace.getActiveTextEditor()
    const expectedValue = forward ? -1 : 1

    const currentFile = textEditor.getPath()
    const currentPosition = textEditor.getCursorBufferPosition()

    // NOTE: Iterate bottom to top to find the previous message
    // Because if we search top to bottom when sorted, first item will always
    // be the smallest
    if (!forward) {
      messages.reverse()
    }

    for (const message of (messages: Array<LinterMessage>)) {
      if (message[$file] && message[$range] && message[$file] === currentFile && currentPosition.compare(message[$range].start) === expectedValue) {
        visitMessage(message)
        break
      }
    }
  }
  requestMessages(): Array<LinterMessage> {
    const filePath = atom.workspace.getActiveTextEditor().getPath()
    const event = { messages: [], filePath }
    this.emitter.emit('should-provide-messages', event)
    return event.messages
  }
  onShouldProvideMessages(callback: Function): Disposable {
    return this.emitter.on('should-provide-messages', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
