'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import Editor from './editor'
import { getEditorsMap } from './helpers'
import type { Disposable, TextEditor } from 'atom'
import type { Linter$Difference, Linter$Message, Config$ShowIssues } from './types'

export default class Editors {
  emitter: Emitter;
  editors: Set<Editor>;
  messages: Array<Linter$Message>;
  subscriptions: CompositeDisposable;
  showIssuesFrom: Config$ShowIssues;
  highlightIssues: boolean;

  constructor() {
    this.emitter = new Emitter()
    this.editors = new Set()
    this.messages = []
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.observe('linter-ui-default.showIssuesFrom', showIssuesFrom => {
      this.showIssuesFrom = showIssuesFrom
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.highlightIssues', highlightIssues => {
      const previousValue = this.highlightIssues
      this.highlightIssues = highlightIssues
      if (highlightIssues && !previousValue) {
        this.apply({ added: this.messages, messages: this.messages, removed: [] }, true)
      } else if (!highlightIssues && previousValue) {
        this.apply({ added: [], messages: [], removed: this.messages }, true)
      }
    }))

    this.subscriptions.add(this.emitter)
  }
  activate() {
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      this.getEditor(textEditor)
    }))
  }
  apply(difference: Linter$Difference, force: boolean = false) {
    this.messages = difference.messages
    if (!this.highlightIssues && !force) {
      // Do not paint anything if highlighting issues is disabled
      return
    }

    const { editorsMap, filePaths } = getEditorsMap(this)
    for (const message of difference.added) {
      if (message.filePath && message.range && editorsMap[message.filePath]) {
        editorsMap[message.filePath].added.push(message)
      }
    }
    for (const message of difference.removed) {
      if (message.filePath && message.range && editorsMap[message.filePath]) {
        editorsMap[message.filePath].removed.push(message)
      }
    }
    for (const filePath of filePaths) {
      const value = editorsMap[filePath]
      if (value.added.length || value.removed.length) {
        if (value.editors.length === 1) {
          value.editors[0].apply(value.added, value.removed)
        } else if (value.editors.length === 2) {
          value.editors[0].apply(value.added, value.removed)
          value.editors[1].apply(value.added, value.removed)
        } else {
          for (const entry of value.editors) {
            entry.apply(value.added, value.removed)
          }
        }
      }
    }
  }
  filterAndApply(editor: Editor) {
    const messages = []
    const editorPath = editor.textEditor.getPath()
    for (const message of this.messages) {
      if (message.filePath && message.range && message.filePath === editorPath) {
        messages.push(message)
      }
    }
    editor.apply(messages, editor.messages)
  }
  getEditor(textEditor: TextEditor): Editor {
    for (const entry of this.editors) {
      if (entry.textEditor === textEditor) {
        return entry
      }
    }
    const editor = new Editor(textEditor)
    this.editors.add(editor)
    editor.onDidDestroy(() => {
      this.editors.delete(editor)
    })
    editor.onShouldRender(() => {
      this.emitter.emit('should-render')
    })
    this.filterAndApply(editor)
    return editor
  }
  getByFilePath(filePath: string): Array<Editor> {
    const editors = []
    for (const entry of this.editors) {
      if (entry.textEditor.getPath() === filePath) {
        editors.push(entry)
      }
    }
    return editors
  }
  onShouldRender(callback: Function): Disposable {
    return this.emitter.on('should-render', callback)
  }
  dispose() {
    for (const entry of this.editors) {
      entry.dispose()
    }
    this.subscriptions.dispose()
  }
}
