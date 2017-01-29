/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { TextEditor } from 'atom'
import Editor from './editor'
import { $file, getEditorsMap } from './helpers'
import type { LinterMessage, MessagesPatch } from './types'

export default class Editors {
  emitter: Emitter;
  editors: Set<Editor>;
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.emitter = new Emitter()
    this.editors = new Set()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
      this.getEditor(textEditor)
    }))
  }
  update({ messages, added, removed }: MessagesPatch) {
    this.messages = messages

    const { editorsMap, filePaths } = getEditorsMap(this)
    for (let i = 0, length = added.length; i < length; i++) {
      const message = added[i]
      const filePath = $file(message)
      if (filePath && editorsMap[filePath]) {
        editorsMap[filePath].added.push(message)
      }
    }
    for (let i = 0, length = removed.length; i < length; i++) {
      const message = removed[i]
      const filePath = $file(message)
      if (filePath && editorsMap[filePath]) {
        editorsMap[filePath].removed.push(message)
      }
    }

    for (let i = 0, length = filePaths.length; i < length; i++) {
      const filePath = filePaths[i]
      const value = editorsMap[filePath]
      if (value.added.length || value.removed.length) {
        value.editors.forEach(editor => editor.apply(value.added, value.removed))
      }
    }
  }
  filterAndApply(editor: Editor) {
    const messages = []
    const editorPath = editor.textEditor.getPath()
    if (editorPath) {
      for (let i = 0, length = this.messages.length; i < length; i++) {
        const message = this.messages[i]
        if ($file(message) === editorPath) {
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
