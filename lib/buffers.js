'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Editor from './editor'
import Buffer from './buffer'
import type { TextBuffer } from 'atom'
import type { Linter$Difference } from './types'

export default class Buffers {
  buffers: Set<Buffer>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.buffers = new Set()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const editor = new Editor(textEditor)
      const buffer = this.getByBuffer(textEditor.getBuffer())
      buffer.attachEditor(editor)
    }))
  }
  apply(difference: Linter$Difference) {
    console.log(difference)
  }
  getByBuffer(textBuffer: TextBuffer): Buffer {
    for (const buffer of this.buffers) {
      if (buffer.getBuffer() === textBuffer) {
        return buffer
      }
    }
    const buffer = new Buffer(textBuffer)
    buffer.onDidDestroy(() => {
      this.subscriptions.remove(buffer)
    })
    this.subscriptions.add(buffer)
    return buffer
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
