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
    this.highlightIssues = atom.config.get('linter-ui-default.highlightIssues')
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.highlightIssues', function({ newValue }) {
      this.highlightIssues = newValue
    }))

    this.subscriptions.add(this.emitter)
  }
  activate() {
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const editor = this.getEditor(textEditor)
      console.log(editor)
    }))
  }
  apply(difference: Linter$Difference) {
    if (!this.highlightIssues) {
      // Do not paint anything if highlighting issues is disabled
      return
    }
    this.messages = difference.messages

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
        return textEditor
      }
    }
    const editor = new Editor(textEditor, this.highlightIssues)
    this.editors.add(editor)
    editor.onDidDestroy(() => {
      this.editors.delete(editor)
    })
    editor.onShouldRender(() => {
      if (this.showIssuesFrom === 'Current Line') {
        this.emitter.emit('should-render')
      }
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
