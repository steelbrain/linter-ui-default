/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'

import { filterMessages } from '../helpers'
import type { LinterMessage } from '../types'

export default class PanelDelegate {
  emitter: Emitter;
  messages: Array<LinterMessage>;
  visibility: boolean;
  panelHeight: number;
  subscriptions: CompositeDisposable;
  panelRepresents: 'Entire Project' | 'Current File';
  panelTakesMinimumHeight: boolean;

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe('linter-ui-default.panelRepresents', (panelRepresents) => {
      const notInitial = typeof this.panelRepresents !== 'undefined'
      this.panelRepresents = panelRepresents
      if (notInitial) {
        this.update(this.messages)
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelHeight', (panelHeight) => {
      const notInitial = typeof this.panelHeight !== 'undefined'
      this.panelHeight = panelHeight
      if (notInitial) {
        this.emitter.emit('observe-panel-config')
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelTakesMinimumHeight', (panelTakesMinimumHeight) => {
      const notInitial = typeof this.panelTakesMinimumHeight !== 'undefined'
      this.panelTakesMinimumHeight = panelTakesMinimumHeight
      if (notInitial) {
        this.emitter.emit('observe-panel-config')
      }
    }))
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((paneItem) => {
      const shouldUpdate = typeof this.visibility !== 'undefined' && this.panelRepresents !== 'Entire Project'
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
    if (this.panelRepresents === 'Entire Project') {
      filteredMessages = this.messages
    } else if (this.panelRepresents === 'Current File') {
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
  updatePanelHeight(panelHeight: number): void {
    atom.config.set('linter-ui-default.panelHeight', panelHeight)
  }
  onDidChangeMessages(callback: ((messages: Array<LinterMessage>) => any)): Disposable {
    return this.emitter.on('observe-messages', callback)
  }
  onDidChangeVisibility(callback: ((visibility: boolean) => any)): Disposable {
    return this.emitter.on('observe-visibility', callback)
  }
  onDidChangePanelConfig(callback: (() => any)): Disposable {
    return this.emitter.on('observe-panel-config', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
