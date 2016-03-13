'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import { Emitter, CompositeDisposable } from 'atom'
import Messages from './elements/panel-messages'
import type { Linter$Message, Linter$Difference } from './types'
import type { Panel as Atom$Panel, Disposable } from 'atom'

export default class Panel {
  panel: Atom$Panel;
  emitter: Emitter;
  messages: Array<Linter$Message>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
  }
  activate() {
    const element = document.createElement('linter-panel')
    this.panel = atom.workspace.addBottomPanel({
      item: element,
      visible: true,
      priority: 500
    })
    React.render(<Messages panel={this} />, element)
  }
  apply(difference: Linter$Difference) {
    this.emitter.emit('did-update-messages', difference.messages)
  }
  observeMessages(callback: Function): Disposable {
    callback(this.messages)
    return this.onDidUpdateMessages(callback)
  }
  onDidUpdateMessages(callback: Function): Disposable {
    return this.emitter.on('did-update-messages', callback)
  }
  dispose() {
    this.subscriptions.dispose()
    if (this.panel) {
      this.panel.destroy()
    }
  }
}
