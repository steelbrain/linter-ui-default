/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import { calculateDecorations } from './helpers'
import type { LinterMessage, TreeViewHighlight } from '../types'

class TreeView {
  emitter: Emitter;
  messages: Array<LinterMessage>;
  decorations: Object;
  subscriptions: CompositeDisposable;
  decorateOnTreeView: 'Files and Directories' | 'Files' | 'None';

  constructor() {
    this.emitter = new Emitter()
    this.messages = []
    this.decorations = {}
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.decorateOnTreeView', (decorateOnTreeView) => {
      if (typeof this.decorateOnTreeView === 'undefined') {
        this.decorateOnTreeView = decorateOnTreeView
      } else if (decorateOnTreeView === 'None') {
        this.update([])
        this.decorateOnTreeView = decorateOnTreeView
      } else {
        const messages = this.messages
        this.decorateOnTreeView = decorateOnTreeView
        this.update(messages)
      }
    }))

    setTimeout(() => {
      const element = TreeView.getElement()
      if (!element) {
        return
      }
      // Subscription is only added if the CompositeDisposable hasn't been disposed
      this.subscriptions.add(disposableEvent(element, 'click', debounce(() => {
        this.update()
      })))
    }, 100)
  }
  update(givenMessages: ?Array<LinterMessage> = null) {
    if (Array.isArray(givenMessages)) {
      this.messages = givenMessages
    }
    const messages = this.messages

    const element = TreeView.getElement()
    const decorateOnTreeView = this.decorateOnTreeView
    if (!element || decorateOnTreeView === 'None') {
      return
    }

    this.applyDecorations(calculateDecorations(decorateOnTreeView, messages))
  }
  applyDecorations(decorations: Object) {
    const treeViewElement = TreeView.getElement()
    if (!treeViewElement) {
      return
    }

    const elementCache = {}
    const appliedDecorations = {}

    Object.keys(this.decorations).forEach((filePath) => {
      if (!{}.hasOwnProperty.call(this.decorations, filePath)) {
        return
      }
      if (!decorations[filePath]) {
        // Removed
        const element = elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath))
        if (element) {
          this.removeDecoration(element)
        }
      }
    })

    Object.keys(decorations).forEach((filePath) => {
      if (!{}.hasOwnProperty.call(decorations, filePath)) {
        return
      }
      const element = elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath))
      if (element) {
        this.handleDecoration(element, !!this.decorations[filePath], decorations[filePath])
        appliedDecorations[filePath] = decorations[filePath]
      }
    })

    this.decorations = appliedDecorations
  }

  handleDecoration(element: HTMLElement, update: boolean = false, highlights: TreeViewHighlight) {
    let decoration
    if (update) {
      decoration = element.querySelector('linter-decoration')
    }
    if (decoration) {
      decoration.className = ''
    } else {
      decoration = document.createElement('linter-decoration')
      element.appendChild(decoration)
    }
    if (highlights.error) {
      decoration.classList.add('linter-error')
    } else if (highlights.warning) {
      decoration.classList.add('linter-warning')
    } else if (highlights.info) {
      decoration.classList.add('linter-info')
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
  static getElementByPath(parent: HTMLElement, filePath: string): ?HTMLElement {
    return parent.querySelector(`[data-path=${CSS.escape(filePath)}]`)
  }
}

module.exports = TreeView
