'use babel'

/* @flow */

import Path from 'path'
import { CompositeDisposable, Emitter } from 'sb-event-kit'
import { projectPathByFile } from './helpers'
import type { Message, MessageLegacy, MessagesPatch } from './types'

type HighlightInfo = Map<string, { highlights: Set<string>, projectPath: string }>

export default class TreeView {
  emitter: Emitter;
  messages: Array<Message | MessageLegacy>;
  decorations: HighlightInfo;
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
    const entries: HighlightInfo = new Map()
    const projectPaths: Array<string> = atom.project.getPaths()
    for (let i = 0, length = difference.messages.length, message; i < length; ++i) {
      message = difference.messages[i]
      const filePath = message.version === 1 ? message.filePath : message.location.file
      if (!filePath) {
        // For compatibility purpose only
        continue
      }
      let entry = entries.get(filePath)
      if (!entry) {
        const projectPath = projectPathByFile(projectPaths, filePath)
        if (!projectPath) {
          continue
        }
        entries.set(filePath, entry = { highlights: new Set(), projectPath })
      }
      entry.highlights.add(message.severity)
    }
    if (this.decorateOnTreeView === 'Files and Directories') {
      for (const [filePath, details] of entries) {
        const chunks = filePath.split(Path.sep)
        while (chunks.length) {
          const currentDir = chunks.join(Path.sep)
          let entry = entries.get(currentDir)
          if (!entry) {
            entries.set(currentDir, entry = { highlights: new Set(), projectPath: details.projectPath })
          }
          for (const highlight of details.highlights) {
            entry.highlights.add(highlight)
          }
          if (currentDir === details.projectPath) {
            break
          }
          chunks.pop()
        }
      }
    }
    console.log(entries)
  }
  dispose() {
    this.subscriptions.dispose()
  }
  static getElement() {
    return document.querySelector('.tree-view')
  }
}
