'use babel'

import {Emitter, CompositeDisposable} from 'atom'

export class Editor {
  constructor(editorLinter) {
    this.editor = editorLinter.editor
    this.editorLinter = editorLinter
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.rowMessages = {}
    this.highlight = atom.config.get('linter-ui-default.highlightIssues')

    this.gutter = null
    this.bubble = null
    this.bubbleRange = null
    this.handleGutter()

    this.subscriptions.add(this.emitter)
  }
  handleGutter() {
    if (this.highlight) {
      const position = atom.config.get('linter-ui-default.gutterPosition')
      this.gutter = this.editor.addGutter({
        name: 'linter-ui-default',
        priority: position === 'Left' ? -100 : 100
      })
    }
  }
  updateMessages({added, removed}) {
    if (this.highlight) {
      const addedLength = added.length
      const removedLength = removed.length

      for (let i = 0; i < addedLength; ++i) {
        const message = added[i]
        // Add it to rowMessages
        const messageRow = message.range.start.row
        if (!this.rowMessages[messageRow]) {
          this.rowMessages[messageRow] = [message]
        } else {
          this.rowMessages[messageRow].push(message)
        }
      }
      for (let i = 0; i < removedLength; ++i) {
        const message = removed[i]
        // Remove it from rowMessages
        const messageRow = message.range.start.row
        if (this.rowMessages[messageRow]) {
          const rowMessages = this.rowMessages[messagRow]
          const index = rowMessages.indexOf(message)
          if (index !== -1) {
            rowMessages.splice(index, 1)
          }
        }
      }
    }
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
    this.rowMessages = []
    this.subscriptions.dispose()
  }
}
