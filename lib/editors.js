/* @flow */

import { CompositeDisposable } from 'atom'
import type { TextEditor } from 'atom'
import Editor from './editor'
import { $file, getEditorsMap, filterMessages } from './helpers'
import type { LinterMessage, MessagesPatch } from './types'

class Editors {
  editors: Set<Editor>;
  messages: Array<LinterMessage>;
  firstRender: bool;
  subscriptions: CompositeDisposable;

  constructor() {
    this.editors = new Set()
    this.messages = []
    this.firstRender = true
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
      this.getEditor(textEditor)
    }))
    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem((paneItem) => {
      this.editors.forEach((editor) => {
        if (editor.textEditor !== paneItem) {
          editor.removeTooltip()
        }
      })
    }))
  }
  isFirstRender(): boolean {
    return this.firstRender
  }
  update({ messages, added, removed }: MessagesPatch) {
    this.messages = messages
    this.firstRender = false

    const { editorsMap, filePaths } = getEditorsMap(this)
    added.forEach(function(message) {
      const filePath = $file(message)
      if (filePath && editorsMap[filePath]) {
        editorsMap[filePath].added.push(message)
      }
    })
    removed.forEach(function(message) {
      const filePath = $file(message)
      if (filePath && editorsMap[filePath]) {
        editorsMap[filePath].removed.push(message)
      }
    })

    filePaths.forEach(function(filePath) {
      const value = editorsMap[filePath]
      if (value.added.length || value.removed.length) {
        value.editors.forEach(editor => editor.apply(value.added, value.removed))
      }
    })
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
    editor.subscriptions.add(textEditor.onDidChangeGrammar(() => {
      editor.dispose()
      this.getEditor(textEditor)
    }))
    editor.apply(filterMessages(this.messages, textEditor.getPath()), [])
    return editor
  }
  dispose() {
    for (const entry of this.editors) {
      entry.dispose()
    }
    this.subscriptions.dispose()
  }
}

module.exports = Editors
