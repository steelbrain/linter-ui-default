'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import type { Disposable } from 'atom'
import type { Atom$Point, Linter$Message } from './types'

type Commands$Last = {
  filePath: string,
  position: Atom$Point
}

export default class Commands {
  emitter: Emitter;
  lastPosition: ?Commands$Last;
  subscriptions: CompositeDisposable;

  constructor() {
    this.emitter = new Emitter()
    this.lastPosition = null
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'linter-ui-default:next-error': () => this.move(true),
      'linter-ui-default:previous-error': () => this.move()
    }))
  }
  move(forward: boolean = false) {
    const messages = this.requestMessages()
    console.log(forward, messages)
  }
  requestMessages(): Array<Linter$Message> {
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
