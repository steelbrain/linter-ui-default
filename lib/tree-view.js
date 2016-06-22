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
      this.decorateOnTreeView = decorateOnTreeView
    }))
  }
  apply(difference: MessagesPatch) {
    this.messages = difference.messages
    const element = TreeView.getElement()
    if (!element) {
      return
    }

    for (const message of difference.added) {

    }
    for (const message of difference.removed) {

    }
  }
  dispose() {
    this.subscriptions.dispose()
  }
  static getElement() {
    return document.querySelector('.tree-view')
  }
}
