'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Message, MessageLegacy, MessagesPatch } from './types'

export default class TreeView {
  emitter: Emitter;
  messages: Array<Message | MessageLegacy>;
  subscriptions: CompositeDisposable;
  decorateOnTreeView: 'Files and Directories' | 'Files' | 'None';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.decorateOnTreeView', decorateOnTreeView => {
      if (typeof this.decorateOnTreeView === 'undefined') {
        this.decorateOnTreeView = decorateOnTreeView
      } else if (decorateOnTreeView === 'None') {
        this.apply({ added: [], messages: [], removed: this.messages })
        this.decorateOnTreeView = decorateOnTreeView
      } else {
        const messages = this.messages
        this.apply({ added: [], messages: [], removed: this.messages })
        this.decorateOnTreeView = decorateOnTreeView
        this.apply({ added: messages, messages, removed: [] })
      }
    }))
  }
  apply(difference: MessagesPatch) {
    this.messages = difference.messages
    const element = TreeView.getElement()
    const decorateOnTreeView = this.decorateOnTreeView
    if (!element || decorateOnTreeView === 'None') {
      return
    }

    for (const message of difference.removed) {

    }

    for (const message of difference.added) {

    }
  }
  dispose() {
    this.subscriptions.dispose()
  }
  static getElement() {
    return document.querySelector('.tree-view')
  }
}
