/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'
import { sortMessages } from './helpers'
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
    }))
  }
  move(forward: boolean = false) {
    const messages = sortMessages(this.requestMessages())
    const expectedValue = forward ? -1 : 1
    const currentPosition = atom.workspace.getActiveTextEditor().getCursorBufferPosition()
    if (!forward) {
      messages.reverse()
    }
    for (const message of (messages: Array<LinterMessage>)) {
      const messageFile = message.version === 1 ? message.filePath : message.location.file
      const messageRange = message.version === 1 ? message.range : message.location.position
      if (messageRange && currentPosition.compare(messageRange.start) === expectedValue) {
        atom.workspace.open(messageFile, { searchAllPanes: true }).then(function() {
          const textEditor = atom.workspace.getActiveTextEditor()
          if (textEditor && textEditor.getPath() === messageFile) {
            textEditor.setCursorBufferPosition(messageRange.start)
          }
        })
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
