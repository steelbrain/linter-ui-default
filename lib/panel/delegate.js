/* @flow */

import { CompositeDisposable, Disposable, Emitter, Range } from 'atom'

import { filterMessages, filterMessagesByRangeOrPoint } from '../helpers'
import type { LinterMessage } from '../types'

class PanelDelegate {
  emitter: Emitter;
  messages: Array<LinterMessage>;
  filteredMessages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;
  panelRepresents: 'Entire Project' | 'Current File' | 'Current Line';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.filteredMessages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe('linter-ui-default.panelRepresents', (panelRepresents) => {
      const notInitial = typeof this.panelRepresents !== 'undefined'
      this.panelRepresents = panelRepresents
      if (notInitial) {
        this.update()
      }
    }))
    let changeSubscription
    this.subscriptions.add(atom.workspace.observeActivePaneItem((paneItem) => {
      if (changeSubscription) {
        changeSubscription.dispose()
        changeSubscription = null
      }
      const isTextEditor = atom.workspace.isTextEditor(paneItem)
      if (isTextEditor) {
        if (this.panelRepresents !== 'Entire Project') {
          this.update()
        }
        let oldRow = -1
        changeSubscription = paneItem.onDidChangeCursorPosition(({ newBufferPosition }) => {
          if (oldRow !== newBufferPosition.row && this.panelRepresents === 'Current Line') {
            oldRow = newBufferPosition.row
            this.update()
          }
        })
      }

      if (this.panelRepresents !== 'Entire Project' || isTextEditor) {
        this.update()
      }
    }))
    this.subscriptions.add(new Disposable(function() {
      if (changeSubscription) {
        changeSubscription.dispose()
      }
    }))
  }
  getFilteredMessages(): Array<LinterMessage> {
    let filteredMessages = []
    if (this.panelRepresents === 'Entire Project') {
      filteredMessages = this.messages
    } else if (this.panelRepresents === 'Current File') {
      const activeEditor = atom.workspace.getActiveTextEditor()
      if (!activeEditor) return []
      filteredMessages = filterMessages(this.messages, activeEditor.getPath())
    } else if (this.panelRepresents === 'Current Line') {
      const activeEditor = atom.workspace.getActiveTextEditor()
      if (!activeEditor) return []
      const activeLine = activeEditor.getCursors()[0].getBufferRow()
      filteredMessages = filterMessagesByRangeOrPoint(this.messages, activeEditor.getPath(), Range.fromObject([[activeLine, 0], [activeLine, Infinity]]))
    }
    return filteredMessages
  }
  update(messages: ?Array<LinterMessage> = null): void {
    if (Array.isArray(messages)) {
      this.messages = messages
    }
    this.filteredMessages = this.getFilteredMessages()
    this.emitter.emit('observe-messages', this.filteredMessages)
  }
  onDidChangeMessages(callback: ((messages: Array<LinterMessage>) => any)): Disposable {
    return this.emitter.on('observe-messages', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}

module.exports = PanelDelegate
