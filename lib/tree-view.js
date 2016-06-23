'use babel'

/* @flow */

import Path from 'path'
import { CompositeDisposable, Emitter } from 'sb-event-kit'
import { projectPathByFile } from './helpers'
import type { Message, MessageLegacy, MessagesPatch, TreeViewHighlights, TreeViewPatch } from './types'

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
    const decorations: TreeViewHighlights = new Map()
    const projectPaths: Array<string> = atom.project.getPaths()
    for (let i = 0, length = difference.messages.length, message; i < length; ++i) {
      message = difference.messages[i]
      const filePath = message.version === 1 ? message.filePath : message.location.file
      if (!filePath) {
        // For compatibility purpose only
        continue
      }
      let decoration = decorations.get(filePath)
      if (!decoration) {
        const projectPath = projectPathByFile(projectPaths, filePath)
        if (!projectPath) {
          continue
        }
        decorations.set(filePath, decoration = { highlights: new Set(), projectPath })
      }
      decoration.highlights.add(message.severity)
    }
    if (this.decorateOnTreeView === 'Files and Directories') {
      for (const [filePath, details] of decorations) {
        const chunks = filePath.split(Path.sep)
        while (chunks.length) {
          const currentDir = chunks.join(Path.sep)
          let decoration = decorations.get(currentDir)
          if (!decoration) {
            decorations.set(currentDir, decoration = { highlights: new Set(), projectPath: details.projectPath })
          }
          for (const highlight of details.highlights) {
            decoration.highlights.add(highlight)
          }
          if (currentDir === details.projectPath) {
            break
          }
          chunks.pop()
        }
      }
    }
    this.applyDifference(this.calculateDifference(decorations))
  }
  calculateDifference(decorations: TreeViewHighlights): TreeViewPatch {
    const patch: TreeViewPatch = { added: new Map(), removed: new Map(), updated: new Map() }
    for (const [filePath, details] of decorations) {
      const oldDecoration = this.decorations.get(filePath)
      if (!oldDecoration) {
        patch.added.set(filePath, details)
        continue
      }
      for (const highlight of details.highlights) {
        if (!oldDecoration.highlights.has(highlight)) {
          patch.removed.set(filePath, oldDecoration)
          patch.added.set(filePath, details)
          continue
        }
      }
      for (const highlight of oldDecoration.highlights) {
        if (!details.highlights.has(highlight)) {
          patch.removed.set(filePath, oldDecoration)
          patch.added.set(filePath, details)
          continue
        }
      }
    }
    for (const [filePath, details] of this.decorations) {
      if (!decorations.has(filePath)) {
        patch.removed.set(filePath, details)
      }
    }
    return patch
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
