'use babel'

/* @flow */

import { CompositeDisposable, Emitter, Disposable } from 'atom'
import type { TextEditor, TextBuffer, TextEditorMarker } from 'atom'
import type { Linter$Message } from './types'
import type Editor from './editor'

export default class Buffer {
  emitter: Emitter;
  markers: Object; // Object<string, TextEditorMarker>
  filePath: string;
  messages: Array<Linter$Message>;
  textBuffer: TextBuffer;
  textEditors: Set<TextEditor>;
  subscriptions: CompositeDisposable;

  constructor(textBuffer: TextBuffer) {
    this.emitter = new Emitter()
    this.markers = { }
    this.filePath = textBuffer.getPath()
    this.messages = []
    this.textBuffer = textBuffer
    this.textEditors = new Set()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(textBuffer.onDidChangePath(filePath => {
      this.filePath = filePath
    }))
    this.subscriptions.add(textBuffer.onDidDestroy(() => {
      this.dispose()
    }))
  }
  getBuffer(): TextBuffer {
    return this.textBuffer
  }
  attachEditor(editor: Editor) {
    this.textEditors.add(editor)
    this.subscriptions.add(editor)
    editor.onDidDestroy(() => {
      this.subscriptions.remove(editor)
      this.textEditors.delete(editor)
    })
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()

    for (const key in this.markers) {
      const value = this.markers[key]
      value.destroy()
    }
    this.markers = { }
  }
}
