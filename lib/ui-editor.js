'use babel'

import {Emitter, CompositeDisposable} from 'atom'

export class Editor {
  constructor(editorLinter) {
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable(this.emitter)

    this.subscriptions.add(editorLinter.onDidDestroy(() => {
      this.dispose()
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.gutterEnabled', () => {
      this.handleGutter()
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.gutterPosition', () => {
      this.handleGutter()
    }))

    this.editorLinter = editorLinter
    this.gutter = null
    this.handleGutter()
  }

  handleGutter() {
    const enabled = atom.config.get('linter-ui-default.gutterEnabled')
    const position = atom.config.get('linter-ui-default.gutterPosition')

    if (this.gutter) {
      try {
        this.gutter.destroy()
      } catch(_) {}
      this.gutter = null
    }

    if (enabled) {
      this.gutter = this.editorLinter.editor.addGutter({
        name: 'linter-ui-default',
        priority: position === 'Left' ? -100 : 100
      })
    }
  }

  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback)
  }

  dispose() {
    try {
      this.gutter.destroy()
    } catch (_) {}
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
