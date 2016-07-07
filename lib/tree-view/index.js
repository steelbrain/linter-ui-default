'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import { calculateDecorations } from './helpers'
import type { Message, MessageLegacy, MessagesPatch } from '../types'

export default class TreeView {
  element: HTMLElement;
  emitter: Emitter;
  messages: Array<Message | MessageLegacy>;
  decorations: Object;
  subscriptions: CompositeDisposable;
  decorateOnTreeView: 'Files and Directories' | 'Files' | 'None';

  constructor() {
    this.element = TreeView.getElement()
    this.emitter = new Emitter()
    this.messages = []
    this.decorations = {}
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.decorateOnTreeView', decorateOnTreeView => {
      if (typeof this.decorateOnTreeView === 'undefined') {
        this.decorateOnTreeView = decorateOnTreeView
      } else if (decorateOnTreeView === 'None') {
        this.render()
        this.decorateOnTreeView = decorateOnTreeView
      } else {
        const messages = this.messages
        this.render()
        this.decorateOnTreeView = decorateOnTreeView
        this.render(messages)
      }
    }))

    if (this.element) {
      this.subscriptions.add(disposableEvent(this.element, 'click', debounce(() => {
        this.render(this.messages)
      })))
    }
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
  render(messages: Array<Message | MessageLegacy> = []) {
    this.apply({ added: [], messages: [], removed: this.messages })
    if (messages.length) {
      this.apply({ added: messages, messages, removed: [] })
    }
  }
  applyDecorations(decorations: Object) {
    if (!this.element) {
      return
    }
    for (const filePath in this.decorations) {
      if (!this.decorations.hasOwnProperty(filePath)) {
        continue
      }
      if (!decorations[filePath]) {
        // Removed
        const element = TreeView.getElementByPath(this.element, filePath)
        if (element) {
          this.removeDecoration(element)
        }
      }
    }
    for (const filePath in decorations) {
      if (!decorations.hasOwnProperty(filePath)) {
        continue
      }
      const element = TreeView.getElementByPath(this.element, filePath)
      if (!element) {
        continue
      }
      if (!this.decorations[filePath]) {
        // New
        this.addDecoration(element, decorations[filePath])
      } else {
        this.removeDecoration(element)
        this.addDecoration(element, decorations[filePath])
      }
    }
    this.decorations = decorations
  }
  addDecoration(element: HTMLElement, highlights: Set<string>) {
    const decoration = document.createElement('linter-decoration')
    element.appendChild(decoration)
    for (const highlight of highlights) {
      decoration.classList.add(`linter-${highlight}`)
    }
  }
  removeDecoration(element: HTMLElement) {
    const decoration = element.querySelector('linter-decoration')
    if (decoration) {
      decoration.remove()
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
