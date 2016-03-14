'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import filter from 'lodash.filter'
import { Emitter, CompositeDisposable } from 'atom'
import Messages from './elements/panel-messages'
import type { Linter$Message } from './types'
import type { Panel as Atom$Panel, Disposable } from 'atom'

export default class Panel {
  panel: Atom$Panel;
  emitter: Emitter;
  messages: Array<Linter$Message>;
  subscriptions: CompositeDisposable;
  showIssuesFrom: 'All Files' | 'Current File' | 'Current Line';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    const element = document.createElement('linter-panel')
    this.panel = atom.workspace.addBottomPanel({
      item: element,
      visible: true,
      priority: 500
    })
    React.render(<Messages panel={this} />, element)

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showIssuesFrom', showIssuesFrom => {
      this.showIssuesFrom = showIssuesFrom
    }))
    this.subscriptions.add(atom.workspace.observeActivePaneItem(paneItem => {
      if (atom.workspace.isTextEditor(paneItem)) {
        this.panel.show()
      } else {
        this.panel.hide()
      }
      if (this.showIssuesFrom !== 'All Files') {
        this.apply(this.messages)
      }
    }))
  }
  apply(messages: Array<Linter$Message>) {
    this.messages = messages

    let filteredMessages = messages
    if (this.showIssuesFrom === 'All Files') {
      /* No filtering required */
    } else if (this.showIssuesFrom === 'Current File') {
      const activeEditor = atom.workspace.getActiveTextEditor()
      const activePath = activeEditor && activeEditor.getPath() || NaN
      filteredMessages = filter(messages, message => message.filePath === activePath)
    } // TODO: Implement Current Line filter
    this.emitter.emit('did-update-messages', filteredMessages)
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
