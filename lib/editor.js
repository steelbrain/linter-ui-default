'use babel'

import {Emitter, CompositeDisposable} from 'atom'

export class Editor {
  constructor(editorLinter) {
    this.editor = editorLinter.editor
    this.editorLinter = editorLinter
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()

    this.subscriptions.add(this.emitter)
  }
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback)
  }
  destroy() {
    this.emitter.emit('did-destroy')
  }
  dispose() {
    this.editor = null
    this.editorLinter = null
    this.subscriptions.dispose()
  }
}
