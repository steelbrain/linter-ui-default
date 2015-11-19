'use babel'

/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {Emitter, CompositeDisposable} from 'atom'
import {createTooltip} from './element-tooltip'

export class Editor {
  constructor(editorLinter) {
    this.emitter = new Emitter()
    this.underlineMarkers = new Map()
    this.rowMarkers = new Map()
    this.rowMessages = new Map()
    this.subscriptions = new CompositeDisposable(this.emitter)

    this.subscriptions.add(editorLinter.onDidDestroy(() => {
      this.dispose()
    }))
    this.underlineIssues = atom.config.get('linter-ui-default.underlineIssues')
    this.showBubbleWhen = atom.config.get('linter-ui-default.showBubbleWhen')

    this.editor = editorLinter.editor
    this.gutter = null
    this.handleGutter()
  }

  addMessage(message) {
    if (this.gutter) {
      const row = message.range.start.row

      if (this.underlineIssues) {
        const marker = this.editor.markBufferRange(message.range, {invalidate: 'inside'})
        this.editor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${message.class}`
        })
        this.underlineMarkers.set(message, marker)
      }

      if (!this.rowMarkers.has(row)) {
        const marker = this.editor.markBufferRange([[row, 0], [row, 0]], {invalidate: 'never'})
        const element = <span class={`linter-gutter linter-highlight ${message.class}`}></span>
        element.addEventListener('mouseenter', () => {
          createTooltip(element, this.rowMessages.get(row))
        })
        this.gutter.decorateMarker(marker, {
          class: 'linter-row',
          item: element
        })
        this.rowMarkers.set(row, marker)
        this.rowMessages.set(row, new Set())
      }

      if (this.showBubbleWhen === 'Gutter is hovered') {
        this.rowMessages.get(row).add(message)
      }
    }
  }
  removeMessage(message) {
    const row = message.range.start.row
    if (this.underlineMarkers.has(message)) {
      this.underlineMarkers.get(message).destroy()
      this.underlineMarkers.delete(message)
    }
    if (this.rowMarkers.has(row)) {
      const messages = this.rowMessages.get(row)
      messages.delete(message)
      if (!messages.size) {
        this.rowMarkers.get(row).destroy()
        this.rowMarkers.delete(row)
        this.rowMessages.delete(row)
      }
    }
  }

  handleGutter() {
    const enabled = atom.config.get('linter-ui-default.gutterEnabled')

    if (enabled) {
      const position = atom.config.get('linter-ui-default.gutterPosition')
      this.gutter = this.editor.addGutter({
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
    if (this.underlineMarkers.size) {
      this.underlineMarkers.forEach(marker => marker.destroy())
      this.underlineMarkers.clear()
    }
    if (this.rowMarkers.size) {
      this.rowMarkers.forEach(marker => marker.destroy())
      this.rowMarkers.clear()
    }
    this.rowMessages.clear()
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
