'use babel'

/* @flow */

import invariant from 'assert'
import {CompositeDisposable, Disposable} from 'atom'
import {Editor} from './editor'
import type {TextBuffer, TextEditor} from 'atom'
import type {Linter$Message, Linter$Difference} from './types'

export class Editors {
  buffers: Set<TextBuffer>;
  messages: Array<Linter$Message>;
  textEditors: Map<TextEditor, Editor>;
  subscriptions: CompositeDisposable;
  bufferSubscriptions: Map<TextBuffer, CompositeDisposable>;

  constructor() {
    this.buffers = new Set()
    this.messages = []
    this.textEditors = new Map()
    this.subscriptions = new CompositeDisposable()
    this.bufferSubscriptions = new Map()
  }
  activate() {
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const buffer = textEditor.getBuffer()
      const editor = new Editor(textEditor)
      const subscriptions = this.getBufferSubscriptions(buffer)
      subscriptions.add(editor)
      subscriptions.add(editor.onDidDestroy(() => {
        subscriptions.remove(editor)
        this.textEditors.delete(textEditor)
      }))
      this.textEditors.set(textEditor, editor)
    }))
  }
  getBufferSubscriptions(textBuffer: TextBuffer): CompositeDisposable {
    let subscriptions = this.bufferSubscriptions.get(textBuffer)
    if (!subscriptions) {
      subscriptions = new CompositeDisposable()
      subscriptions.add(textBuffer.onDidDestroy(function() {
        subscriptions.dispose()
      }))
      subscriptions.add(new Disposable(() => {
        this.bufferSubscriptions.delete(textBuffer)
      }))
      this.bufferSubscriptions.set(textBuffer, subscriptions)
    }
    return subscriptions
  }
  dispose() {
    this.subscriptions.dispose()
    for (const entry of this.bufferSubscriptions.values()) {
      entry.dispose()
    }
  }
}
