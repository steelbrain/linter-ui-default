'use babel'

/* @flow */

import invariant from 'assert'
import {CompositeDisposable, Disposable} from 'atom'
import {Editor} from './editor'
import {getEditorsMap} from './helpers'
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
  didCalculateMessages({added, removed, messages}: Linter$Difference) {
    this.messages = messages

    const {editorMap, filePaths} = getEditorsMap(this)
    const addedLength = added.length
    const removedLength = removed.length
    const pathsLength = filePaths.length
    let i

    for (i = 0; i < addedLength; ++i) {
      const message = added[i]
      if (message.filePath && editorMap[message.filePath]) {
        editorMap[message.filePath].added.push(message)
      }
    }
    for (i = 0; i < removedLength; ++i) {
      const message = removed[i]
      if (message.filePath && editorMap[message.filePath]) {
        editorMap[message.filePath].removed.push(message)
      }
    }

    for (i = 0; i < pathsLength; ++i) {
      const filePath = filePaths[i]
      const editorEntry = editorMap[filePath]
      const added = editorEntry.added
      const removed = editorEntry.removed
      console.log('added', added, 'removed', removed)
    }
  }
  dispose() {
    this.subscriptions.dispose()
    for (const entry of this.buffers) {
      entry.subscriptions.dispose()
    }
  }
}
