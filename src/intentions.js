/* @flow */

import invariant from 'assert'
import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'
import type { Point, TextBuffer, TextEditor } from 'atom'
import type Editor from './editor'

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
    const allFixes = []

    for (const message of editor.messages) {
      const hasFixes = message.version === 1 ? message.fix : message.solutions && message.solutions.length
      if (!hasFixes) {
        continue
      }
      const isInRange = message.version === 1 ? message.range && message.range.containsPoint(bufferPosition) : message.location.position.containsPoint(bufferPosition)
      if (!isInRange) {
        continue
      }
      let fixes = []
      if (message.version === 1 && message.fix) {
        fixes.push(message.fix)
      } else if (message.version === 2 && message.solutions && message.solutions.length) {
        fixes = message.solutions
      }
      const linterName = message.linterName || 'Linter'

      for (const fix of (fixes: Array<Object>)) {
        allFixes.push({
          priority: 200,
          icon: 'tools',
          title: fix.title || `Fix ${linterName} issue`,
          selected() {
            Intentions.applyFix(editor.textEditor.getBuffer(), message.version, fix)
          },
        })
      }
    }
    return allFixes
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

  static applyFix(textBuffer: TextBuffer, version: 1 | 2, fix: Object) {
    const range = version === 1 ? fix.range : fix.position
    const currentText = version === 1 ? fix.oldText : fix.currentText
    const replaceWith = version === 1 ? fix.newText : fix.replaceWith

    if (currentText) {
      const textInRange = textBuffer.getTextInRange(range)
      if (currentText !== textInRange) {
        console.warn('[linter-ui-default] Not applying fix because text did not match the expected one', 'expected', currentText, 'but got', textInRange)
        return
      }
    }
    textBuffer.setTextInRange(range, replaceWith)
  }
}
