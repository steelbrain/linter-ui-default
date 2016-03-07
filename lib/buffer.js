'use babel'

/* @flow */

import { CompositeDisposable, Emitter, Disposable } from 'atom'
import { getMessageClass } from './helpers'
import { getElement as getGutterElement } from './elements/gutter'
import type { TextEditor, TextBuffer, TextEditorMarker } from 'atom'
import type { Linter$Message } from './types'
import type Editor from './editor'

export default class Buffer {
  emitter: Emitter;
  markers: Object; // Object<string, TextEditorMarker>
  messages: Set<Linter$Message>;
  textBuffer: TextBuffer;
  textEditors: Set<TextEditor>;
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
  apply(added: Array<Linter$Message>, removed: Array<Linter$Message>) {
    for (const message of removed) {
      const markers = this.markers[message.id]
      if (markers) {
        if (markers.length === 1) {
          markers[0].destroy()
        } else if (markers.length === 2) {
          markers[0].destroy()
          markers[1].destroy()
        } else {
          for (const marker of markers) {
            marker.destroy()
          }
        }
        this.markers[message.id] = null
      }
      this.messages.delete(message)
    }

    for (const message of added) {
      const markers = []
      this.markers[message.id] = markers
      this.messages.add(message)
      const messageClass = getMessageClass(message)
      for (const editor of this.textEditors) {
        const marker = editor.textEditor.markBufferRange(message.range, {
          invalidate: 'never',
          persistent: false
        })
        editor.textEditor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${messageClass}`
        })
        if (editor.gutter) {
          editor.gutter.decorateMarker(marker, {
            class: 'linter-row',
            item: getGutterElement(messageClass)
          })
        }
        markers.push(marker)
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
      const value = this.markers[key]
      if (value) {
        value.destroy()
      }
    }
    this.markers = { }
  }
}
