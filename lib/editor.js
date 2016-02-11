'use babel'

import {Emitter, Disposable, CompositeDisposable} from 'atom'
import {getBubble} from './elements/bubble'

export class Editor {
  constructor(textEditor) {
    this.editor = textEditor
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.rowMessages = {}
    this.markers = new Map()
    this.highlight = atom.config.get('linter-ui-default.highlightIssues')
    this.showBubble = true

    this.gutter = null
    this.bubble = null
    this.handleGutter()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(this.editor.onDidChangeCursorPosition(({newBufferPosition}) => {
      this.handleBubble(newBufferPosition)
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showBubble', showBubble => {
      this.showBubble = showBubble
    }))
    this.subscriptions.add(textEditor.onDidDestroy(() => this.dispose()))
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

        const marker = this.editor.markBufferRange(message.range, {invalidate: 'never'})
        const gutter = document.createElement('span')
        gutter.className = `linter-gutter linter-highlight ${message.className}`
        this.editor.decorateMarker(marker, {
          type: 'highlight',
          class: `linter-highlight ${message.className}`
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
      this.handleBubble()
    }
  }
  handleBubble(position = null) {
    if (position === null) {
      position = this.editor.getCursorBufferPosition()
    }
    if (this.bubble) {
      this.bubble.dispose()
    }
    if (!this.rowMessages[position.row]) {
      return
      // ^ Ignore if we got no messages for current row
    }
    if (this.showBubble) {
      this.updateBubble(position)
    }
  }
  updateBubble(position) {
    const messages = []

    const rowMessages = this.rowMessages[position.row]
    if (rowMessages) {
      const rowMessagesLength = rowMessages.length
      for (let i = 0; i < rowMessagesLength; ++i) {
        const currentMessage = rowMessages[i]
        if (this.markers.get(currentMessage).getBufferRange().containsPoint(position)) {
          messages.push(currentMessage)
        }
      }
    }

    if (messages.length) {
      const {bubbleElement, disposable} = getBubble(messages)
      const marker = this.editor.markBufferRange([position, position], {invalidate: 'never'})
      this.editor.decorateMarker(marker, {
        type: 'overlay',
        item: bubbleElement
      })
      this.bubble = new Disposable(() => {
        disposable.dispose()
        marker.destroy()
        this.bubble = null
      })
    }
  }
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.editor = null
    this.rowMessages = []
    if (this.bubble) {
      this.bubble.dispose()
    }
    if (this.markers.size) {
      this.markers.forEach(function(marker) {
        try {
          marker.destroy()
        } catch (_) {}
      })
      this.markers = null
    }
    this.subscriptions.dispose()
  }
}
