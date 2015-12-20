'use babel'

import {CompositeDisposable} from 'atom'

export class Editor {
  constructor(editorLinter) {
    this.editor = editorLinter.editor
    this.editorLinter = editorLinter
    this.subscriptions = new CompositeDisposable()
  }
  dispose() {
    this.editor = null
    this.editorLinter = null
    this.subscriptions.dispose()
  }
}
