import { CompositeDisposable } from 'atom'
import debounce from 'lodash/debounce'
import disposableEvent from 'disposable-event'
import { calculateDecorations } from './helpers'
import type { LinterMessage, TreeViewHighlight } from '../types'

export default class TreeView {
  messages: Array<LinterMessage> = []
  decorations: Record<string, TreeViewHighlight> = {}
  subscriptions: CompositeDisposable = new CompositeDisposable()
  decorateOnTreeView?: 'Files and Directories' | 'Files' | 'None'

  constructor() {
    this.subscriptions.add(
      atom.config.observe('linter-ui-default.decorateOnTreeView', decorateOnTreeView => {
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
      }),
    )

    setTimeout(() => {
      const element = TreeView.getElement()
      if (!element) {
        return
      }
      // Subscription is only added if the CompositeDisposable hasn't been disposed
      this.subscriptions.add(
        disposableEvent(
          element,
          'click',
          debounce(() => {
            this.update()
          }),
          { passive: true },
        ),
      )
    }, 100)
  }
  update(givenMessages: Array<LinterMessage> | null | undefined = null) {
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
  applyDecorations(decorations: Record<string, TreeViewHighlight>) {
    const treeViewElement = TreeView.getElement()
    if (!treeViewElement) {
      return
    }

    const elementCache = {}
    const appliedDecorations = {}

    Object.keys(this.decorations).forEach(filePath => {
      if (!{}.hasOwnProperty.call(this.decorations, filePath)) {
        return
      }
      if (!decorations[filePath]) {
        // Removed
        const element =
          elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath))
        if (element) {
          this.removeDecoration(element)
        }
      }
    })

    Object.keys(decorations).forEach(filePath => {
      if (!{}.hasOwnProperty.call(decorations, filePath)) {
        return
      }
      const element =
        elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath))
      if (element) {
        this.handleDecoration(element, !!this.decorations[filePath], decorations[filePath])
        appliedDecorations[filePath] = decorations[filePath]
      }
    })

    this.decorations = appliedDecorations
  }

  handleDecoration(element: HTMLElement, update = false, highlights: TreeViewHighlight) {
    let decoration: HTMLElement | null = null
    if (update) {
      decoration = element.querySelector('linter-decoration')
    }
    if (decoration !== null) {
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
  static getElement(): HTMLElement | null {
    return document.querySelector('.tree-view')
  }
  static getElementByPath(parent: HTMLElement, filePath: string): HTMLElement | null {
    return parent.querySelector(`[data-path=${CSS.escape(filePath)}]`)
  }
}
