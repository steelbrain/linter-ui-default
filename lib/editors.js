'use babel'

/* @flow */

import invariant from 'assert'
import {CompositeDisposable, Disposable} from 'atom'
import {Editor} from './editor'
import type {TextBuffer, TextEditor} from 'atom'
import type {Linter$Message, Linter$Difference} from './types'

type Buffer = {
  textBuffer: TextBuffer,
  markers: Map<Linter$Message, TextEditor>,
  subscriptions: CompositeDisposable
}

export class Editors {
  buffers: Set<Buffer>;
  messages: Array<Linter$Message>;
  textEditors: Map<TextEditor, Editor>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.buffers = new Set()
    this.messages = []
    this.textEditors = new Map()
    this.subscriptions = new CompositeDisposable()
  }
  activate() {
    // TODO: Support textBuffer.onDidChangePath
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const textBuffer = textEditor.getBuffer()
      const subscriptions = new CompositeDisposable()
      const editor = new Editor(textEditor)
      const buffer = this.getBuffer(textBuffer)
      subscriptions.add(editor.onDidDestroy(() => {
        buffer.subscriptions.remove(subscriptions)
        this.textEditors.delete(textEditor)
      }), editor)
      buffer.subscriptions.add(subscriptions)
      this.textEditors.set(textEditor, editor)
    }))
  }
  getBuffer(textBuffer: TextBuffer): Buffer {
    for (const entry of this.buffers) {
      if (entry.textBuffer === textBuffer) {
        return entry
      }
    }
    const buffer = {
      textBuffer: textBuffer,
      markers: new Map(),
      subscriptions: new CompositeDisposable()
    }
    buffer.subscriptions.add(textBuffer.onDidDestroy(function() {
      buffer.subscriptions.dispose()
    }))
    buffer.subscriptions.add(new Disposable(() => {
      this.buffers.delete(buffer)
      if (buffer.markers.size) {
        for (const marker of buffer.markers.values()) {
          marker.destroy()
        }
        buffer.markers.clear()
      }
    }))
    this.buffers.add(buffer)
    return buffer
  }
  didCalculateMessages(difference: Linter$Difference) {
    console.log(difference)
  }
  dispose() {
    this.subscriptions.dispose()
    for (const entry of this.buffers) {
      entry.subscriptions.dispose()
    }
  }
}
