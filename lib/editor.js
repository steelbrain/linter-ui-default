'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import type {Disposable, TextEditor, TextBuffer, TextEditorGutter} from 'atom'

export class Editor {
  gutter: ?TextEditorGutter;
  textEditor: TextEditor;
  subscriptions: CompositeDisposable;

  constructor(textEditor: TextEditor) {
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

  }
  getPath(): string {
    return this.textEditor.getPath()
  }
  getBuffer(): TextBuffer {
    return this.textEditor.getBuffer()
  }
  onDidDestroy(callback: Function): Disposable {
    const subscription = this.textEditor.onDidDestroy(callback)
    this.subscriptions.add(subscription)
    return subscription
  }
  dispose() {
    this.subscriptions.dispose()
    if (this.gutter) {
      this.gutter.destroy()
    }
  }
}
