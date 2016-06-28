'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import { calculateAdded } from './helpers'
import type { Message, MessageLegacy, MessagesPatch, TreeViewHighlights, TreeViewPatch } from '../types'

export default class TreeView {
  emitter: Emitter;
  messages: Array<Message | MessageLegacy>;
  decorations: TreeViewHighlights;
  subscriptions: CompositeDisposable;
  decorateOnTreeView: 'Files and Directories' | 'Files' | 'None';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.decorations = new Map()
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
        this.apply({ added: [], messages: [], removed: messages })
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
    const differenceAdded = calculateAdded(decorateOnTreeView, difference.added)
    console.log('added', differenceAdded)
  }
  applyDifference(difference: TreeViewPatch) {
    const parent = TreeView.getElement()
    if (!parent) {
      return
    }
    for (const [filePath, details] of difference.removed) {
      const element = TreeView.getElementByPath(parent, filePath)
      if (element) {
        for (const highlight of details.highlights) {
          element.classList.remove(`linter-${highlight}`)
        }
      }
    }
    for (const [filePath, details] of difference.added) {
      const element = TreeView.getElementByPath(parent, filePath)
      if (element) {
        for (const highlight of details.highlights) {
          element.classList.add(`linter-${highlight}`)
        }
      }
    }
  }
  dispose() {
    this.subscriptions.dispose()
  }
  static getElement() {
    return document.querySelector('.tree-view')
  }
  static getElementByPath(parent: HTMLElement, filePath): ?HTMLElement {
    return parent.querySelector(`[data-path=${CSS.escape(filePath)}]`)
  }
}
