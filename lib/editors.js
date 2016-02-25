'use babel'

/* @flow */

import invariant from 'assert'
import {CompositeDisposable, Disposable} from 'atom'
import {Editor} from './editor'
import {getElement as getGutterElement} from './elements/gutter'
import {getEditorsMap, getMessageClass} from './helpers'
import type {TextBuffer, TextEditor, TextEditorMarker} from 'atom'
import type {Linter$Message, Linter$Difference, Buffer$Difference} from './types'

type Buffer = {
  markers: Map<Linter$Message, TextEditorMarker>,
  textBuffer: TextBuffer,
  subscriptions: CompositeDisposable
}

export class Editors {
  buffers: Set<Buffer>;
  messages: Array<Linter$Message>;
  textEditors: Map<TextEditor, Editor>;
  subscriptions: CompositeDisposable;
  highlightIssues: boolean;

  constructor() {
    this.buffers = new Set()
    this.messages = []
    this.textEditors = new Map()
    this.subscriptions = new CompositeDisposable()
    this.highlightIssues = atom.config.get('linter-ui-default.highlightIssues')
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
  getByBuffer(textBuffer: TextBuffer): Array<Editor> {
    const textEditors = []
    for (const editor of this.textEditors.values()) {
      if (editor.getBuffer() === textBuffer) {
        textEditors.push(editor)
      }
    }
    return textEditors
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

    for (const message of added) {
      if (message.filePath && message.range && editorMap[message.filePath]) {
        editorMap[message.filePath].added.push(message)
      }
    }
    for (const message of removed) {
      if (message.filePath && message.range && editorMap[message.filePath]) {
        editorMap[message.filePath].removed.push(message)
      }
    }

    for (const filePath of filePaths) {
      const editorEntry: Buffer$Difference = editorMap[filePath]
      const added = editorEntry.added
      const removed = editorEntry.removed
      if (removed.length || removed.length) {
        const editors = this.getByBuffer(editorEntry.textBuffer)
        for (const message of added) {
          if (this.highlightIssues) {
            const marker = editorEntry.textBuffer.markRange(message.range, {
              invalidate: 'never',
              persistent: false
            })
            const messageClass = getMessageClass(message)
            editorEntry.markers.set(message, marker)
            for (const editor of editors) {
              const gutter = editor.gutter
              editor.decorateMarker(marker, {
                type: 'highlight',
                class: `linter-highlight ${messageClass}`
              })
              invariant(gutter)
              gutter.decorateMarker(marker, {
                class: 'linter-row',
                item: getGutterElement(messageClass)
              })
            }
          }
        }
        for (const message of removed) {
          const marker = editorEntry.markers.get(message)
          if (marker) {
            marker.destroy()
            editorEntry.markers.delete(message)
          }
        }
      }
    }
  }
  dispose() {
    this.subscriptions.dispose()
    for (const entry of this.buffers) {
      entry.subscriptions.dispose()
    }
  }
}
