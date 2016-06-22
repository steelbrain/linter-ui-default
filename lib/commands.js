'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import { sortMessages } from './helpers'
import type { Disposable } from 'atom'
import type { Message, MessageLegacy } from './types'

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
    for (let i = 0, length = messages.length, message; i < length; i++) {
      message = messages[i]
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
  requestMessages(): Array<Message | MessageLegacy> {
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
