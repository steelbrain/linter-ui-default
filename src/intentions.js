/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'
import type { Point, TextEditor } from 'atom'

import { $range, applySolution } from './helpers'
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
    const toReturn = []

    for (const message of editor.messages) {
      const hasFixes = message.version === 1 ? message.fix : message.solutions && message.solutions.length
      if (!hasFixes) {
        continue
      }
      const isInRange = message[$range] && message[$range].containsPoint(bufferPosition)
      if (!isInRange) {
        continue
      }
      let solutions = []
      if (message.version === 1 && message.fix) {
        solutions.push(message.fix)
      } else if (message.version === 2 && message.solutions && message.solutions.length) {
        solutions = message.solutions
      }
      const linterName = message.linterName || 'Linter'

      for (const solution of (solutions: Array<Object>)) {
        toReturn.push({
          priority: solution.priority ? solution.priority + 200 : 200,
          icon: 'tools',
          title: solution.title || `Fix ${linterName} issue`,
          selected() {
            applySolution(editor.textEditor, message.version, solution)
          },
        })
      }
    }
    return toReturn
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
}
