/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { TextEditor } from 'atom'
import Editor from './editor'
import { $file, getEditorsMap } from './helpers'
import type { LinterMessage, MessagesPatch, Config$ShowIssues } from './types'

export default class Editors {
  emitter: Emitter;
  editors: Set<Editor>;
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;
  showIssuesFrom: Config$ShowIssues;
  showDecorations: boolean;

  constructor() {
    this.emitter = new Emitter()
    this.editors = new Set()
    this.messages = []
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.observe('linter-ui-default.showIssuesFrom', (showIssuesFrom) => {
      this.showIssuesFrom = showIssuesFrom
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', (showDecorations) => {
      const previousValue = this.showDecorations
      this.showDecorations = showDecorations
      if (showDecorations && !previousValue) {
        this.update({ added: this.messages, messages: this.messages, removed: [] }, true)
      } else if (!showDecorations && previousValue) {
        this.update({ added: [], messages: [], removed: this.messages }, true)
      }
    }))

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
      this.getEditor(textEditor)
    }))
  }
  update(difference: MessagesPatch, force: boolean = false) {
    this.messages = difference.messages
    if (!this.showDecorations && !force) {
      // Do not paint anything if highlighting issues is disabled
      return
    }

    const { editorsMap, filePaths } = getEditorsMap(this)
    for (const message of (difference.added: Array<LinterMessage>)) {
      const filePath = message[$file]
      if (filePath && editorsMap[filePath]) {
        editorsMap[filePath].added.push(message)
      }
    }
    for (const message of (difference.removed: Array<LinterMessage>)) {
      const filePath = message[$file]
      if (filePath && editorsMap[filePath]) {
        editorsMap[filePath].removed.push(message)
      }
    }

    for (const filePath of (filePaths: Array<string>)) {
      const value = editorsMap[filePath]
      if (value.added.length || value.removed.length) {
        if (value.editors.length === 1) {
          value.editors[0].apply(value.added, value.removed)
        } else if (value.editors.length === 2) {
          value.editors[0].apply(value.added, value.removed)
          value.editors[1].apply(value.added, value.removed)
        } else {
          for (const editor of (value.editors: Array<Editor>)) {
            editor.apply(value.added, value.removed)
          }
        }
      }
    }
  }
  filterAndApply(editor: Editor) {
    const messages = []
    const editorPath = editor.textEditor.getPath()
    if (editorPath) {
      for (const message of (this.messages: Array<LinterMessage>)) {
        if (message[$file] === editorPath) {
          messages.push(message)
        }
      }
    }
    editor.apply(messages, editor.messages.size ? Array.from(editor.messages) : [])
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
    editor.subscriptions.add(textEditor.onDidChangePath(() => {
      editor.dispose()
      this.getEditor(textEditor)
    }))
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
  dispose() {
    for (const entry of this.editors) {
      entry.dispose()
    }
    this.subscriptions.dispose()
  }
}
