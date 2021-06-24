import { CompositeDisposable } from 'atom'
const { config } = atom
import disposableEvent from 'disposable-event'
import type { TargetWithAddEventListener } from 'disposable-event/src/target'

import { debounce, get } from '../helpers'
import { calculateDecorations } from './helpers'
import type { LinterMessage } from '../types'

export type TreeViewHighlight = {
  info: boolean
  error: boolean
  warning: boolean
}

export default class TreeView {
  messages: Array<LinterMessage> = []
  decorations: Record<string, TreeViewHighlight> = {}
  subscriptions: CompositeDisposable = new CompositeDisposable()
  decorateOnTreeView?: 'Files and Directories' | 'Files' | 'None'

  constructor() {
    this.subscriptions.add(
      config.observe('linter-ui-default.decorateOnTreeView', (decorateOnTreeView: TreeView['decorateOnTreeView']) => {
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
          (element as unknown) as TargetWithAddEventListener,
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

  applyDecorations(decorations: Record<string, TreeViewHighlight | undefined>) {
    const treeViewElement = TreeView.getElement()
    if (!treeViewElement) {
      return
    }

    const elementCache = new Map<string, HTMLElement>()
    const appliedDecorations: Record<string, TreeViewHighlight> = {}

    const filePaths = Object.keys(this.decorations)
    for (const filePath of filePaths) {
      if (!(filePath in decorations)) {
        // Removed
        const element = get(elementCache, filePath, () => TreeView.getElementByPath(treeViewElement, filePath))
        if (element !== null) {
          removeDecoration(element)
        }
      }
    }

    const filePathsNew = Object.keys(decorations)
    for (const filePath of filePathsNew) {
      const element = get(elementCache, filePath, () => TreeView.getElementByPath(treeViewElement, filePath))
      if (element !== null) {
        // decorations[filePath] is not undefined because we are looping over the existing keys
        const decoration = decorations[filePath] as TreeViewHighlight
        handleDecoration(element, decoration, Boolean(this.decorations[filePath]))
        appliedDecorations[filePath] = decoration
      }
    }

    this.decorations = appliedDecorations
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

function handleDecoration(element: HTMLElement, highlights: TreeViewHighlight, update: boolean = false) {
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

function removeDecoration(element: HTMLElement) {
  element.querySelector('linter-decoration')?.remove()
}
