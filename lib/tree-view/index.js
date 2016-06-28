'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import { calculateDecorations } from './helpers'
import type { Message, MessageLegacy, MessagesPatch } from '../types'

export default class TreeView {
  emitter: Emitter;
  messages: Array<Message | MessageLegacy>;
  decorations: Object;
  subscriptions: CompositeDisposable;
  decorateOnTreeView: 'Files and Directories' | 'Files' | 'None';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.decorations = {}
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

    this.applyDecorations(calculateDecorations(decorateOnTreeView, difference.messages))
  }
  applyDecorations(decorations: Object) {
    const parent = TreeView.getElement()
    if (!parent) {
      return
    }
    for (const filePath in this.decorations) {
      if (!this.decorations.hasOwnProperty(filePath)) {
        continue
      }
      if (!decorations[filePath]) {
        // Removed
        const element = TreeView.getElementByPath(parent, filePath)
        if (!element) {
          continue
        }
        element.classList.remove('linter-error')
        element.classList.remove('linter-warning')
        element.classList.remove('linter-info')
      }
    }
    for (const filePath in decorations) {
      if (!decorations.hasOwnProperty(filePath)) {
        continue
      }
      const element = TreeView.getElementByPath(parent, filePath)
      if (!element) {
        continue
      }
      if (!this.decorations[filePath]) {
        // New
        for (const highlight of decorations[filePath]) {
          element.classList.add(`linter-${highlight}`)
        }
        continue
      }
      for (const highlight of this.decorations[filePath]) {
        element.classList.remove(`linter-${highlight}`)
      }
      for (const highlight of decorations[filePath]) {
        element.classList.add(`linter-${highlight}`)
      }
    }
    this.decorations = decorations
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
