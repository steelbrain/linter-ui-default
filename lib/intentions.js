'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import { getMessageRange } from './helpers'
import type Editor from './editor'
import type { Linter$Fix } from './types'
import type { Point, TextBuffer, TextEditor, Disposable } from 'atom'

export default class Intentions {
  emitter: Emitter;
  subscriptions: CompositeDisposable;
  grammarScopes: Array<string>;

  constructor() {
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()
    this.grammarScopes = ['*']

    this.subscriptions.add(this.emitter)
  }
  getIntentions({ textEditor, bufferPosition } : { textEditor: TextEditor, bufferPosition: Point }): Array<Object> {
    const editor = this.requestEditor(textEditor)
    for (const message of editor.messages) {
      const fix = message.fix
      if (fix && getMessageRange(message).containsPoint(bufferPosition)) {
        return [{
          priority: 200,
          icon: 'tools',
          title: 'Fix linter issue',
          selected() {
            Intentions.applyFix(editor.textEditor.getBuffer(), fix)
          }
        }]
      }
    }
    return []
  }
  requestEditor(textEditor: TextEditor): Editor {
    const event = { textEditor, editor: null }
    this.emitter.emit('should-provide-editor', event)
    if (event.editor) {
      return event.editor
    }
    throw new Error('Editor not found')
  }
  onShouldProvideEditor(callback: Function): Disposable {
    return this.emitter.on('should-provide-editor', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }

  static applyFix(textBuffer: TextBuffer, fix: Linter$Fix) {
    const oldText = fix.oldText
    if (oldText) {
      const currentText = textBuffer.getTextInRange(fix.range)
      if (currentText !== oldText) {
        console.warn('[linter-ui-default] Not applying fix because text did not match the expected one', 'expected', oldText, 'but got', currentText)
        return
      }
    }
    textBuffer.setTextInRange(fix.range, fix.newText)
  }
}
