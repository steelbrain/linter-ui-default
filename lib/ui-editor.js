'use babel'

/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {Emitter, CompositeDisposable} from 'atom'
import {createBubble} from './helpers'

export class Editor {
  constructor(editorLinter) {
    this.emitter = new Emitter()
    this.underlineMarkers = new Map()
    this.rowMessages = new Map()
    this.subscriptions = new CompositeDisposable(this.emitter)

    this.subscriptions.add(editorLinter.onDidDestroy(() => {
      this.dispose()
    }))
    this.underlineIssues = atom.config.get('linter-ui-default.underlineIssues')

    this.editor = editorLinter.editor
    this.gutter = null
    this.bubble = null
    this.bubbleRange = null
    this.handleGutter()

    this.subscriptions.add(this.editor.onDidChangeCursorPosition(({newBufferPosition}) => {
      this.handleBubble(newBufferPosition)
    }))
  }

  addMessage(message) {
    // TODO: Show underlines even when gutter disabled?
    if (this.gutter) {
      const row = message.range.start.row

      if (this.underlineIssues) {
        const marker = this.editor.markBufferRange(message.range, {invalidate: 'inside'})
        const gutter = document.createElement('span')
        this.editor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${message.class}`
        })
        this.gutter.decorateMarker(marker, {
          class: 'linter-row',
          item: gutter
        })
        gutter.className = `linter-gutter linter-highlight ${message.class}`
        this.underlineMarkers.set(message, marker)
      }

      if (!this.rowMessages.has(row)) {
        this.rowMessages.set(row, new Set())
      }
      this.rowMessages.get(row).add(message)
    }
  }
  removeMessage(message) {
    const row = message.range.start.row
    if (this.underlineMarkers.has(message)) {
      this.underlineMarkers.get(message).destroy()
      this.underlineMarkers.delete(message)
    }
    if (this.rowMessages.has(row)) {
      const messages = this.rowMessages.get(row)
      messages.delete(message)
      if (!messages.size) {
        this.rowMessages.delete(row)
      }
    }
    if (message.range && message.range === this.bubbleRange) {
      this.removeBubble()
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

  handleBubble(position = null) {
    if (position === null) {
      position = this.editor.getCursorBufferPosition()
    }
    if (this.bubbleRange && this.bubbleRange.containsPoint(position)) {
      return
      // ^ The bubble stays the same
    }
    this.removeBubble()
    if (!this.rowMessages.has(position.row)) {
      return
      // ^ Ignore if we got no messages for current row
    }
    this.updateBubble(position)
  }

  updateBubble(position) {
    let message = null

    this.rowMessages.get(position.row).forEach(function(currentMessage) {
      if (message === null &&
        currentMessage.range &&
        currentMessage.range.containsPoint(position)) {
        message = currentMessage
      }
    })

    if (message !== null) {
      this.bubbleRange = message.range
      const ofUnderline = this.underlineMarkers.has(message)
      const marker = ofUnderline ?
        this.underlineMarkers.get(message) :
        this.editor.markBufferRange(message.range, {invalidate: 'inside'})
      const decoration = this.editor.decorateMarker(marker, {
        type: 'overlay',
        item: createBubble(message)
      })

      if (ofUnderline) {
        this.bubble = decoration
      } else {
        this.bubble = marker
      }
    }
  }

  removeBubble() {
    if (this.bubble) {
      this.bubble.destroy()
      this.bubbleRange = null
      this.bubble = null
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
    this.removeBubble()
    this.rowMessages.clear()
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
