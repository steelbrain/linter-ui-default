/* @flow */

import { Range } from 'atom'
import { CompositeDisposable, Emitter, Disposable } from 'sb-event-kit'
import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import type { TextEditor, BufferMarker, TextEditorGutter, TextEditorMarker, Point } from 'atom'
import { getMessagesOnPoint, getBufferPositionFromMouseEvent } from './helpers'
import getGutterElement from './elements/gutter'
import getBubbleElement from './elements/bubble'
import type { LinterMessage } from './types'

export default class Editor {
  gutter: ?TextEditorGutter;
  bubble: ?TextEditorMarker;
  emitter: Emitter;
  markers: Map<LinterMessage, BufferMarker>;
  messages: Set<LinterMessage>;
  textEditor: TextEditor;
  showBubble: boolean;
  bubbleRange: ?Range;
  bubbleMessage: ?LinterMessage;
  subscriptions: CompositeDisposable;
  cursorPosition: ?Point;
  showProviderName: boolean;

  constructor(textEditor: TextEditor) {
    this.bubble = null
    this.emitter = new Emitter()
    this.markers = new Map()
    this.messages = new Set()
    this.textEditor = textEditor
    this.bubbleRange = null
    this.bubbleMessage = null
    this.subscriptions = new CompositeDisposable()

    let lastshowDecorations = false
    this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', showDecorations => {
      this.updateGutter(showDecorations)
      lastshowDecorations = showDecorations
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.gutterPosition', ({ newValue }) => {
      this.updateGutter(lastshowDecorations, newValue)
    }))

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showBubble', showBubble => {
      this.showBubble = showBubble
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
      this.showProviderName = showProviderName
    }))
    this.subscriptions.add(textEditor.onDidDestroy(() => {
      this.dispose()
    }))

    let tooltipSubscription
    this.subscriptions.add(atom.config.observe('linter-ui-default.tooltipFollows', tooltipFollows => {
      if (tooltipSubscription) {
        tooltipSubscription.dispose()
      }
      if (tooltipFollows === 'Mouse') {
        const editorElement = atom.views.getView(textEditor)
        tooltipSubscription = new CompositeDisposable()
        tooltipSubscription.add(disposableEvent(editorElement, 'mousemove', debounce(e => {
          if (editorElement.component && e.target.nodeName === 'ATOM-TEXT-EDITOR') {
            if (this.bubbleRange) {
              this.cursorPosition = getBufferPositionFromMouseEvent(e, textEditor, editorElement)
              if (this.cursorPosition && this.bubbleRange && this.bubbleRange.containsPoint(this.cursorPosition)) {
                return
              }
            }
            this.removeBubble()
          }
        }, 200, true)))
        tooltipSubscription.add(disposableEvent(editorElement, 'mousemove', debounce(e => {
          if (editorElement.component && e.target.nodeName === 'ATOM-TEXT-EDITOR') {
            this.cursorPosition = getBufferPositionFromMouseEvent(e, textEditor, editorElement)
            if (this.cursorPosition) {
              this.updateBubble()
            }
          } // The property `component` is removed after an editor is disposed
        }, 200)))
        this.removeBubble()
      } else {
        tooltipSubscription = textEditor.onDidChangeCursorPosition(debounce(({ newBufferPosition }) => {
          this.cursorPosition = newBufferPosition
          this.updateBubble()
        }, 60))
        this.updateBubble(textEditor.getCursorBufferPosition())
      }
    }))
    this.subscriptions.add(new Disposable(function() {
      tooltipSubscription.dispose()
    }))
  }
  updateGutter(visibility: boolean, position: ? 'Left' | 'Right') {
    this.removeGutter()
    if (visibility) {
      position = position || atom.config.get('linter-ui-default.gutterPosition')
      const gutter = this.gutter = this.textEditor.addGutter({
        name: 'linter-ui-default',
        priority: position === 'Left' ? -100 : 100,
      })
      for (const [message, marker] of this.markers) {
        gutter.decorateMarker(marker, {
          class: 'linter-row',
          item: getGutterElement(`linter-${message.severity}`),
        })
      }
    } else {
      this.gutter = null
    }
  }
  removeGutter() {
    if (this.gutter) {
      try {
        this.gutter.destroy()
      } catch (_) { /* No Op */ }
    }
  }
  updateBubble(position: ?Point = null) {
    position = position || this.cursorPosition
    if (!position || (this.bubbleRange && this.bubbleRange.containsPoint(position) && this.bubbleMessage && this.messages.has(this.bubbleMessage))) {
      return
    }
    this.removeBubble()

    const messages = getMessagesOnPoint(this.messages, this.textEditor.getPath(), position)
    if (messages.length) {
      this.bubbleMessage = messages.length === 1 ? messages[0] : null
      if (this.bubbleMessage) {
        this.bubbleRange = this.bubbleMessage.version === 1 ? this.bubbleMessage.range : this.bubbleMessage.location.position
      } else {
        this.bubbleRange = null
      }
      this.bubble = this.textEditor.markBufferRange([position, position])
      this.bubble.onDidDestroy(() => {
        this.bubble = null
        this.bubbleRange = null
        this.bubbleMessage = null
      })
      this.textEditor.decorateMarker(this.bubble, {
        type: 'overlay',
        persistent: false,
        item: getBubbleElement(messages, this.showProviderName),
      })
    }
  }
  removeBubble() {
    if (this.bubble) {
      this.bubble.destroy()
    }
  }
  apply(added: Array<LinterMessage>, removed: Array<LinterMessage>) {
    const textBuffer = this.textEditor.getBuffer()

    for (const message of (removed: Array<LinterMessage>)) {
      const marker = this.markers.get(message)
      if (marker) {
        marker.destroy()
      }
      this.messages.delete(message)
      this.markers.delete(message)
    }

    for (const message of (added: Array<LinterMessage>)) {
      const markerRange = message.version === 1 ? message.range : message.location.position
      if (!markerRange) {
        // Only for backward compatibility
        continue
      }
      const marker = textBuffer.markRange(markerRange, {
        invalidate: 'never',
        persistent: false,
      })
      this.markers.set(message, marker)
      this.messages.add(message)
      this.applyMarker(message)
      marker.onDidChange(({ oldHeadPosition, newHeadPosition, isValid }) => {
        if (isValid && (newHeadPosition.row !== 0 || oldHeadPosition.row === 0)) {
          if (message.version === 1) {
            message.range = marker.previousEventState.range
          } else {
            message.location.position = marker.previousEventState.range
          }
        }
      })
    }

    this.updateBubble()
  }
  applyMarker(message: LinterMessage) {
    const marker = this.markers.get(message)
    const gutter = this.gutter
    const messageClass = `linter-${message.severity}`
    this.textEditor.decorateMarker(marker, {
      type: 'highlight',
      class: `linter-highlight ${messageClass}`,
    })
    if (gutter) {
      gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: getGutterElement(messageClass),
      })
    }
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
    this.removeGutter()
    this.removeBubble()
  }
}
