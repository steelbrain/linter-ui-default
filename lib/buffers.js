'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import Editor from './editor'
import Buffer from './buffer'
import { getBuffersMap, map } from './helpers'
import type { TextBuffer, Disposable } from 'atom'
import type { Linter$Difference, Linter$Message, Config$ShowIssues } from './types'

export default class Buffers {
  buffers: Set<Buffer>;
  emitter: Emitter;
  messages: Array<Linter$Message>;
  subscriptions: CompositeDisposable;
  showIssuesFrom: Config$ShowIssues;
  highlightIssues: boolean;

  constructor() {
    this.buffers = new Set()
    this.emitter = new Emitter()
    this.messages = []
    this.subscriptions = new CompositeDisposable()
    this.highlightIssues = atom.config.get('linter-ui-default.highlightIssues')

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showIssuesFrom', showIssuesFrom => {
      this.showIssuesFrom = showIssuesFrom
    }))
  }
  activate() {
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const buffer = this.getByBuffer(textEditor.getBuffer())
      const editor = new Editor(textEditor, buffer, this.highlightIssues)
      editor.onShouldRender(() => {
        if (this.showIssuesFrom === 'Current Line') {
          this.emitter.emit('should-render')
        }
      })
      buffer.attachEditor(editor)
    }))
  }
  apply(difference: Linter$Difference) {
    if (!this.highlightIssues) {
      // Do not paint anything if highlighting issues is disabled
      return
    }
    this.messages = difference.messages

    const { buffersMap, filePaths } = getBuffersMap(this)
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
    for (const filePath of filePaths) {
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
    buffer.onShouldRender(() => {
      this.emitter.emit('should-render')
    })
    buffer.onDidDestroy(() => {
      this.subscriptions.remove(buffer)
      this.buffers.delete(buffer)
    })
    textBuffer.onDidChangePath(() => {
      const textEditors = map(buffer.editors, editor => editor.textEditor)
      buffer.dispose()
      const newBuffer = this.getByBuffer(textBuffer)
      textEditors.forEach(textEditor => {
        const editor = new Editor(textEditor, newBuffer, this.highlightIssues)
        editor.onShouldRender(() => {
          if (this.showIssuesFrom === 'Current Line') {
            this.emitter.emit('should-render')
          }
        })
        newBuffer.attachEditor(editor)
      })
    })
    this.subscriptions.add(buffer)
    this.buffers.add(buffer)
    this.filterAndApply(buffer)
    return buffer
  }
  filterAndApply(buffer: Buffer) {
    const messages = []
    const bufferPath = buffer.textBuffer.getPath()
    for (const message of this.messages) {
      if (message.filePath && message.range && message.filePath === bufferPath) {
        messages.push(message)
      }
    }
    buffer.apply(messages, buffer.messages)
  }
  onShouldRender(callback: Function): Disposable {
    return this.emitter.on('should-render', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
