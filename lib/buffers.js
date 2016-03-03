'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Editor from './editor'
import Buffer from './buffer'
import { getBuffersMap } from './helpers'
import type { TextBuffer } from 'atom'
import type { Linter$Difference } from './types'

export default class Buffers {
  buffers: Set<Buffer>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.buffers = new Set()
    this.subscriptions = new CompositeDisposable()
  }
  activate() {
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const editor = new Editor(textEditor)
      const buffer = this.getByBuffer(textEditor.getBuffer())
      buffer.attachEditor(editor)
    }))
  }
  apply(difference: Linter$Difference) {
    const buffersMap = getBuffersMap(this)
    for (const message of difference.added) {
      if (message.filePath && message.range && buffersMap[message.filePath]) {
        buffersMap[message.filePath].added.push(message)
      }
    }
    for (const message of difference.removed) {
      if (message.filePath && message.range && buffersMap[message.filePath]) {
        buffersMap[message.filePath].removed.push(message)
      }
    }
    for (const filePath in buffersMap) {
      const value = buffersMap[filePath]
      if (value.added.length || value.removed.length) {
        value.buffer.apply(value.added, value.removed)
      }
    }
  }
  getBuffers(): Set<Buffer> {
    return this.buffers
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
      this.buffers.delete(buffer)
    })
    this.subscriptions.add(buffer)
    this.buffers.add(buffer)
    return buffer
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
