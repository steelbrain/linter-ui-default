/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'
import type { LinterMessage } from '../types'

export default class PanelDelegate {
  emitter: Emitter;
  messages: Array<LinterMessage>;
  paneVisibility: boolean;
  configVisibility: boolean;
  subscriptions: CompositeDisposable;

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', (configVisibility) => {
      const triggerChange = typeof this.configVisibility !== 'undefined'
      this.configVisibility = configVisibility
      if (triggerChange) {
        this.emitter.emit('observe-visibility', this.visibility)
      }
    }))
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((paneItem) => {
      this.paneVisibility = atom.workspace.isTextEditor(paneItem)
      this.emitter.emit('observe-visibility', this.visibility)
    }))
    this.paneVisibility = !!atom.workspace.getActiveTextEditor()
  }
  get visibility(): boolean {
    return this.configVisibility && this.paneVisibility
  }
  update(messages: Array<LinterMessage>): void {
    this.emitter.emit('observe-messages', this.messages = messages)
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
