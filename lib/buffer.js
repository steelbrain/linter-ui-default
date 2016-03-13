'use babel'

/* @flow */

import { CompositeDisposable, Emitter, Disposable } from 'atom'
import { getMessageClass } from './helpers'
import { getElement as getGutterElement } from './elements/gutter'
import type { TextBuffer } from 'atom'
import type { Linter$Message } from './types'
import type Editor from './editor'

export default class Buffer {
  emitter: Emitter;
  markers: Object; // Object<string, TextEditorMarker>
  messages: Set<Linter$Message>;
  textBuffer: TextBuffer;
  textEditors: Set<Editor>;
  subscriptions: CompositeDisposable;

  constructor(textBuffer: TextBuffer) {
    this.emitter = new Emitter()
    this.markers = { }
    this.messages = new Set()
    this.textBuffer = textBuffer
    this.textEditors = new Set()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
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
  apply(added: Array<Linter$Message> | Set<Linter$Message>, removed: Array<Linter$Message> | Set<Linter$Message>) {
    for (const message of removed) {
      const marker = this.markers[message.key]
      if (marker) {
        marker.destroy()
      }
      this.messages.delete(message)
    }

    for (const message of added) {
      const marker = this.textBuffer.markRange(message.range, {
        invalidate: 'never',
        persistent: false
      })
      this.markers[message.key] = marker
      this.messages.add(message)
      const messageClass = getMessageClass(message)
      for (const editor of this.textEditors) {
        editor.textEditor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${messageClass}`
        })
        if (editor.gutter) {
          // $FlowIgnore: Flow is stupid, it think this is going to be null or undefined
          editor.gutter.decorateMarker(marker, {
            class: 'linter-row',
            item: getGutterElement(messageClass)
          })
        }
      }
    }
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()

    for (const key in this.markers) {
      if (this.markers.hasOwnProperty(key)) {
        const marker = this.markers[key]
        if (marker) {
          marker.destroy()
        }
      }
    }
    this.markers = { }
  }
}
