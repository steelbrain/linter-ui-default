/* @flow */

import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import { CompositeDisposable, Emitter, Disposable } from 'sb-event-kit'
import type { TextEditor, BufferMarker, TextEditorGutter, TextEditorMarker, Point } from 'atom'

import getGutterElement from '../elements/gutter'
import getBubbleElement from '../elements/bubble'
import { $range, getMessagesOnRangeOrPoint } from '../helpers'
import { pointInMessageRange, mouseEventNearPosition, getBufferPositionFromMouseEvent } from './helpers'
import type { LinterMessage } from '../types'

export default class Editor {
  gutter: ?TextEditorGutter;
  bubble: ?{
    marker: TextEditorMarker,
    message: ?LinterMessage,
    element: HTMLElement,
  };
  emitter: Emitter;
  markers: Map<LinterMessage, BufferMarker>;
  messages: Set<LinterMessage>;
  textEditor: TextEditor;
  showBubble: boolean;
  subscriptions: CompositeDisposable;
  cursorPosition: ?Point;
  showProviderName: boolean;

  constructor(textEditor: TextEditor) {
    this.bubble = null
    this.emitter = new Emitter()
    this.markers = new Map()
    this.messages = new Set()
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showBubble', (showBubble) => {
      this.showBubble = showBubble
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', (showProviderName) => {
      this.showProviderName = showProviderName
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.showDecorations', () => {
      this.updateGutter()
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.gutterPosition', () => {
      this.updateGutter()
    }))
    this.subscriptions.add(textEditor.onDidDestroy(() => {
      this.dispose()
    }))

    let tooltipSubscription
    this.subscriptions.add(atom.config.observe('linter-ui-default.tooltipFollows', (tooltipFollows) => {
      if (tooltipSubscription) {
        tooltipSubscription.dispose()
      }
      tooltipSubscription = tooltipFollows === 'Mouse' ? this.listenForMouseMovement() : this.listenForKeyboardMovement()
      this.removeBubble()
    }))
    this.subscriptions.add(function() {
      tooltipSubscription.dispose()
    })
    this.updateGutter()
  }
  listenForMouseMovement() {
    const editorElement = atom.views.getView(this.textEditor)
    return disposableEvent(editorElement, 'mousemove', debounce((e) => {
      if (!editorElement.component || e.target.nodeName !== 'ATOM-TEXT-EDITOR') {
        return
      }
      const bubble = this.bubble
      if (bubble && mouseEventNearPosition(e, editorElement, bubble.marker.getStartScreenPosition(), bubble.element.offsetWidth, bubble.element.offsetHeight)) {
        return
      }
      const cursorPosition = getBufferPositionFromMouseEvent(e, this.textEditor, editorElement)
      this.cursorPosition = cursorPosition
      if (cursorPosition) {
        this.updateBubble(this.cursorPosition)
      } else {
        this.removeBubble()
      }
    }, 200, true))
  }
  listenForKeyboardMovement() {
    return this.textEditor.onDidChangeCursorPosition(debounce(({ newBufferPosition }) => {
      this.cursorPosition = newBufferPosition
      this.updateBubble(newBufferPosition)
    }, 60))
  }
  updateGutter() {
    this.removeGutter()
    const visibility = atom.config.get('linter-ui-default.showDecorations')
    if (visibility) {
      const position = atom.config.get('linter-ui-default.gutterPosition')
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
  updateBubble(position: ?Point) {
    if (!position) {
      return
    }
    if (this.bubble && this.bubble.message && this.messages.has(this.bubble.message) && pointInMessageRange(position, this.bubble.message)) {
      return
    }
    this.removeBubble()

    const messages = getMessagesOnRangeOrPoint(this.messages, this.textEditor.getPath(), position)
    if (!messages.length) {
      return
    }

    const bubble = {
      message: messages.length === 1 ? messages[0] : null,
      marker: this.textEditor.markBufferRange([position, position]),
      element: getBubbleElement(messages, this.showProviderName),
    }
    bubble.marker.onDidDestroy(() => {
      this.bubble = null
    })
    this.textEditor.decorateMarker(bubble.marker, {
      type: 'overlay',
      item: bubble.element,
    })
    this.bubble = bubble
  }
  removeBubble() {
    if (this.bubble) {
      this.bubble.marker.destroy()
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
      const markerRange = message[$range]
      if (!markerRange) {
        // Only for backward compatibility
        continue
      }
      const marker = textBuffer.markRange(markerRange, {
        invalidate: 'never',
      })
      this.markers.set(message, marker)
      this.messages.add(message)
      this.applyMarker(message)
      marker.onDidChange(({ oldHeadPosition, newHeadPosition, isValid }) => {
        if (!isValid || (newHeadPosition.row === 0 && oldHeadPosition.row !== 0)) {
          return
        }
        if (message.version === 1) {
          message.range = marker.previousEventState.range
        } else {
          message.location.position = marker.previousEventState.range
        }
      })
    }

    this.updateBubble(this.cursorPosition)
  }
  applyMarker(message: LinterMessage) {
    const marker = this.markers.get(message)
    const gutter = this.gutter
    const messageClass = `linter-${message.severity}`
    this.textEditor.decorateMarker(marker, {
      type: 'highlight',
      class: `linter-highlight ${messageClass}`,
    })
    if (!gutter) {
      return
    }
    gutter.decorateMarker(marker, {
      class: 'linter-row',
      item: getGutterElement(messageClass),
    })
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
