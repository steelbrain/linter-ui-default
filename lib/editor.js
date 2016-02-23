'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import type {Disposable, TextEditor} from 'atom'

export class Editor {
  textEditor: TextEditor;
  subscriptions: CompositeDisposable;

  constructor(textEditor) {
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()
  }
  onDidDestroy(callback: Function): Disposable {
    return this.textEditor.onDidDestroy(callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
