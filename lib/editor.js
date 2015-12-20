'use babel'

import {Emitter, CompositeDisposable} from 'atom'

export class Editor {
  constructor(editorLinter) {
    this.editor = editorLinter.editor
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.rowMessages = {}
    this.markers = new Map()
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

        const marker = this.editor.markBufferRange(message.range, {invalidate: 'inside'})
        const gutter = document.createElement('span')
        gutter.className = `linter-gutter linter-highlight ${message.class}`
        this.editor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${message.class}`
        })
        this.gutter.decorateMarker(marker, {
          class: 'linter-row',
          item: gutter
        })
        this.markers.set(message, marker)
      }
      for (let i = 0; i < removedLength; ++i) {
        const message = removed[i]
        // Remove it from rowMessages
        const messageRow = message.range.start.row
        if (this.rowMessages[messageRow]) {
          const rowMessages = this.rowMessages[messageRow]
          const index = rowMessages.indexOf(message)
          if (index !== -1) {
            rowMessages.splice(index, 1)
          }
        }
        this.markers.get(message).destroy()
        this.markers.delete(message)
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
    this.markers = null
    this.rowMessages = []
    this.subscriptions.dispose()
  }
}
