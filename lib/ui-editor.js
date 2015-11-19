'use babel'

/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'

import {Emitter, CompositeDisposable} from 'atom'

export class Editor {
  constructor(editorLinter) {
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable(this.emitter)
    this.markers = new Map()

    this.subscriptions.add(editorLinter.onDidDestroy(() => {
      this.dispose()
    }))
    this.underlineIssues = atom.config.get('linter-ui-default.underlineIssues')
    this.showBubbleIn = atom.config.get('linter-ui-default.showBubbleIn')

    this.editorLinter = editorLinter
    this.gutter = null
    this.handleGutter()
  }

  addMessage(message) {
    if (this.gutter) {
      const marker = this.editorLinter.editor.markBufferRange(message.range, {invalidate: 'inside'})
      if (this.underlineIssues) {
        this.editorLinter.editor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${message.class}`
        })
      }
      this.gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: <span class={`linter-gutter linter-highlight ${message.class}`}></span>
      })

      this.markers.set(message, marker)
    }
  }
  removeMessage(message) {
    if (this.markers.has(message)) {
      this.markers.get(message).destroy()
      this.markers.delete(message)
    }
  }

  handleGutter() {
    const enabled = atom.config.get('linter-ui-default.gutterEnabled')

    if (enabled) {
      const position = atom.config.get('linter-ui-default.gutterPosition')
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
    if (this.markers.size) {
      this.markers.forEach(marker => marker.destroy())
      this.markers.clear()
    }
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
