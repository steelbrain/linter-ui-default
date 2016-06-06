'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import { sortMessages, visitMessage } from './helpers'
import type { Disposable } from 'atom'
import type { Message } from './types'

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
    for (const message of messages) {
      if (currentPosition.compare(message.location.position.start) === expectedValue) {
        visitMessage(message)
        break
      }
    }
  }
  requestMessages(): Array<Message> {
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
