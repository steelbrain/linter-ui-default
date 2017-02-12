/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'

import { filterMessages } from '../helpers'
import type { LinterMessage } from '../types'

export default class PanelDelegate {
  emitter: Emitter;
  messages: Array<LinterMessage>;
  visibility: boolean;
  subscriptions: CompositeDisposable;
  showIssuesFrom: 'All Files' | 'Current File';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe('linter-ui-default.showIssuesFrom', (showIssuesFrom) => {
      const notInitial = typeof this.showIssuesFrom !== 'undefined'
      this.showIssuesFrom = showIssuesFrom
      if (notInitial) {
        this.update(this.messages)
      }
    }))
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((paneItem) => {
      const shouldUpdate = typeof this.visibility !== 'undefined' && this.showIssuesFrom !== 'All Files'
      this.visibility = atom.workspace.isTextEditor(paneItem)
      this.emitter.emit('observe-visibility', this.visibility)

      if (shouldUpdate) {
        this.update(this.messages)
      }
    }))
    this.visibility = !!atom.workspace.getActiveTextEditor()
  }
  get filteredMessages(): Array<LinterMessage> {
    let filteredMessages = []
    if (this.showIssuesFrom === 'All Files') {
      filteredMessages = this.messages
    } else if (this.showIssuesFrom === 'Current File') {
      const activeEditor = atom.workspace.getActiveTextEditor()
      const editorPath = activeEditor ? activeEditor.getPath() : ''
      if (editorPath) {
        filteredMessages = filterMessages(this.messages, editorPath)
      }
    }
    return filteredMessages
  }
  update(messages: Array<LinterMessage>): void {
    this.messages = messages
    this.emitter.emit('observe-messages', this.filteredMessages)
  }
  onDidChangeMessages(callback: ((messages: Array<LinterMessage>) => any)): Disposable {
    return this.emitter.on('observe-messages', callback)
  }
  onDidChangeVisibility(callback: ((visibility: boolean) => any)): Disposable {
    return this.emitter.on('observe-visibility', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
