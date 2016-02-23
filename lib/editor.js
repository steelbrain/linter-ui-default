'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import type {TextEditor} from 'atom'

export class Editor {
  textEditor: TextEditor;
  subscriptions: CompositeDisposable;

  constructor(textEditor) {
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()
  }
  dispose() {
    this.subscriptions.dispoe()
  }
}
