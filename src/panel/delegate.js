/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'
import type { LinterMessage } from '../types'

export default class PanelDelegate {
  emitter: Emitter;
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()
  }
  update(messages: Array<LinterMessage>): void {
    this.emitter.emit('observe', this.messages = messages)
  }
  observeMessages(callback: ((messages: Array<LinterMessage>) => any)): Disposable {
    callback(this.messages)
    return this.emitter.on('observe', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
