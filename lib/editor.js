'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import type { Disposable, TextEditor, TextBuffer, TextEditorGutter } from 'atom'

export class Editor {
  gutter: ?TextEditorGutter;
  emitter: Emitter;
  textEditor: TextEditor;
  subscriptions: CompositeDisposable;

  constructor(textEditor: TextEditor) {
    this.emitter = new Emitter()
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()

    const visibility = atom.config.get('linter-ui-default.highlightIssues')
    if (visibility) {
      const position = atom.config.get('linter-ui-default.gutterPosition')
      this.gutter = this.textEditor.addGutter({
        name: 'linter-ui-default',
        priority: position === 'Left' ? -100 : 100
      })
    } else this.gutter = null

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(textEditor.onDidDestroy(() => {
      this.dispose()
    }))
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy')
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
    if (this.gutter) {
      this.gutter.destroy()
    }
  }
}
