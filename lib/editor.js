'use babel'

/* @flow */

import { CompositeDisposable, Emitter, Disposable } from 'atom'
import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import { getMessageClass, getMessagesOnPoint } from './helpers'
import { getElement as getGutterElement } from './elements/gutter'
import { getElement as getBubbleElement } from './elements/bubble'
import type { Linter$Message } from './types'
import type { TextEditor, BufferMarker, TextEditorGutter, TextEditorMarker, Point } from 'atom'

export default class Editor {
  gutter: ?TextEditorGutter;
  bubble: ?TextEditorMarker;
  emitter: Emitter;
  markers: Map<Linter$Message, BufferMarker>;
  messages: Set<Linter$Message>;
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

    this.subscriptions.add(atom.config.observe('linter-ui-default.gutterPosition', position => {
      if (this.gutter) {
        this.gutter.destroy()
      }
      this.gutter = this.textEditor.addGutter({
        name: 'linter-ui-default',
        priority: position === 'Left' ? -100 : 100
      })
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.gutterPosition', debounce(() => {
      const gutter = this.gutter
      if (gutter) {
        for (const [message, marker] of this.markers) {
          const messageClass = getMessageClass(message)
          gutter.decorateMarker(marker, {
            class: 'linter-row',
            item: getGutterElement(messageClass)
          })
        }
      }
    }, 0)))

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
    this.subscriptions.add(textEditor.onDidChangePath(() => {
      this.emitter.emit('did-change-path')
    }))

    let lastRow
    this.subscriptions.add(textEditor.onDidChangeCursorPosition(debounce(({ newBufferPosition }) => {
      const newRow = newBufferPosition.row
      if (newRow !== lastRow) {
        lastRow = newRow
        this.emitter.emit('should-render')
      }
    }, 60)))

    let tooltipSubscription
    const editorElement = atom.views.getView(textEditor)
    this.subscriptions.add(atom.config.observe('linter-ui-default.tooltipFollows', tooltipFollows => {
      if (tooltipSubscription) {
        tooltipSubscription.dispose()
      }
      if (tooltipFollows === 'Mouse') {
        tooltipSubscription = new CompositeDisposable()
        tooltipSubscription.add(disposableEvent(editorElement, 'mousemove', debounce(e => {
          if (editorElement.component && e.target.nodeName === 'ATOM-TEXT-EDITOR') {
            this.removeBubble()
          }
        }, 200, true)))
        tooltipSubscription.add(disposableEvent(editorElement, 'mousemove', debounce(e => {
          if (editorElement.component && e.target.nodeName === 'ATOM-TEXT-EDITOR') {
            this.cursorPosition = textEditor.bufferPositionForScreenPosition(editorElement.component.screenPositionForMouseEvent(e))
            this.updateBubble()
          } // The property is removed after an editor is disposed
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
  updateBubble(position: ?Point = null) {
    position = position || this.cursorPosition || this.textEditor.getCursorBufferPosition()
    this.removeBubble()

    const messages = getMessagesOnPoint(this.messages, this.textEditor.getPath(), position)
    if (messages.size) {
      const bubble = this.textEditor.markBufferRange([position, position])
      this.textEditor.decorateMarker(bubble, {
        type: 'overlay',
        persistent: false,
        item: getBubbleElement(messages, this.showProviderName)
      })
      this.bubble = bubble
    }
  }
  removeBubble() {
    if (this.bubble) {
      this.bubble.destroy()
      this.bubble = null
    }
  }
  apply(added: Array<Linter$Message> | Set<Linter$Message>, removed: Array<Linter$Message> | Set<Linter$Message>) {
    const textBuffer = this.textEditor.getBuffer()

    for (const message of removed) {
      const marker = this.markers.get(message)
      if (marker) {
        marker.destroy()
      }
      this.messages.delete(message)
      this.markers.delete(message)
    }

    for (const message of added) {
      const marker = textBuffer.markRange(message.range, {
        invalidate: 'never',
        persistent: false
      })
      this.markers.set(message, marker)
      this.messages.add(message)
      this.applyMarker(message)
      marker.onDidChange(({ oldHeadPosition, newHeadPosition, isValid }) => {
        if (isValid && (newHeadPosition.row !== 0 || oldHeadPosition.row === 0)) {
          message.range = marker.previousEventState.range
        }
      })
    }

    this.updateBubble()
  }
  applyMarker(message: Linter$Message) {
    const marker = this.markers.get(message)
    const messageClass = getMessageClass(message)
    const gutter = this.gutter
    this.textEditor.decorateMarker(marker, {
      type: 'highlight',
      class: `linter-highlight ${messageClass}`
    })
    if (gutter) {
      gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: getGutterElement(messageClass)
      })
    }
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  onShouldRender(callback: Function): Disposable {
    return this.emitter.on('should-render', callback)
  }
  onDidChangePath(callback: Function): Disposable {
    return this.emitter.on('did-change-path', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
    if (this.gutter) {
      // Ignoring because it errors randomly, See #65
      try {
        this.gutter.destroy()
      } catch (_) { /* No Op */ }
    }
    this.removeBubble()
  }
}
