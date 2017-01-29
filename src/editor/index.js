/* @flow */

import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import { CompositeDisposable, Emitter, Disposable } from 'sb-event-kit'
import type { TextEditor, BufferMarker, TextEditorGutter, TextEditorMarker, Point } from 'atom'

import getGutterElement from '../elements/gutter'
import getTooltipElement from '../elements/tooltip'
import { $range, filterMessagesByRangeOrPoint } from '../helpers'
import { hasParent, pointInMessageRange, mouseEventNearPosition, getBufferPositionFromMouseEvent } from './helpers'
import type { LinterMessage } from '../types'

export default class Editor {
  gutter: ?TextEditorGutter;
  tooltip: ?{
    marker: TextEditorMarker,
    message: ?LinterMessage,
    element: HTMLElement,
  };
  emitter: Emitter;
  markers: Map<LinterMessage, BufferMarker>;
  messages: Set<LinterMessage>;
  textEditor: TextEditor;
  showTooltip: boolean;
  subscriptions: CompositeDisposable;
  cursorPosition: ?Point;
  gutterPosition: boolean;
  showDecorations: boolean;
  showProviderName: boolean;

  constructor(textEditor: TextEditor) {
    this.tooltip = null
    this.emitter = new Emitter()
    this.markers = new Map()
    this.messages = new Set()
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showTooltip', (showTooltip) => {
      this.showTooltip = showTooltip
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', (showProviderName) => {
      this.showProviderName = showProviderName
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', (showDecorations) => {
      const shouldUpdate = typeof this.showDecorations !== 'undefined'
      this.showDecorations = showDecorations
      if (shouldUpdate) {
        this.updateGutter()
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.gutterPosition', (gutterPosition) => {
      const shouldUpdate = typeof this.gutterPosition !== 'undefined'
      this.gutterPosition = gutterPosition
      if (shouldUpdate) {
        this.updateGutter()
      }
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
      this.removeTooltip()
    }))
    this.subscriptions.add(function() {
      tooltipSubscription.dispose()
    })
    this.updateGutter()
  }
  listenForMouseMovement() {
    const editorElement = atom.views.getView(this.textEditor)
    return disposableEvent(editorElement, 'mousemove', debounce((e) => {
      if (!editorElement.component || !hasParent(e.target, 'div.line')) {
        return
      }
      const tooltip = this.tooltip
      if (tooltip && mouseEventNearPosition(e, editorElement, tooltip.marker.getStartScreenPosition(), tooltip.element.offsetWidth, tooltip.element.offsetHeight)) {
        return
      }
      // NOTE: Ignore if file is too big
      if (this.textEditor.largeFileMode) {
        this.removeTooltip()
        return
      }
      const cursorPosition = getBufferPositionFromMouseEvent(e, this.textEditor, editorElement)
      this.cursorPosition = cursorPosition
      if (cursorPosition) {
        this.updateTooltip(this.cursorPosition)
      } else {
        this.removeTooltip()
      }
    }, 200, true))
  }
  listenForKeyboardMovement() {
    return this.textEditor.onDidChangeCursorPosition(debounce(({ newBufferPosition }) => {
      this.cursorPosition = newBufferPosition
      this.updateTooltip(newBufferPosition)
    }, 60))
  }
  updateGutter() {
    this.removeGutter()
    if (!this.showDecorations) {
      this.gutter = null
      return
    }
    const priority = this.gutterPosition === 'Left' ? -100 : 100
    const gutter = this.gutter = this.textEditor.addGutter({
      name: 'linter-ui-default',
      priority,
    })
    for (const [message, marker] of this.markers) {
      gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: getGutterElement(`linter-${message.severity}`),
      })
    }
  }
  removeGutter() {
    if (this.gutter) {
      try {
        this.gutter.destroy()
      } catch (_) {
        /* This throws when the text editor is disposed */
      }
    }
  }
  updateTooltip(position: ?Point) {
    if (!position) {
      return
    }
    if (this.tooltip && this.tooltip.message && this.messages.has(this.tooltip.message) && pointInMessageRange(position, this.tooltip.message)) {
      return
    }
    this.removeTooltip()

    const messages = filterMessagesByRangeOrPoint(this.messages, this.textEditor.getPath(), position)
    if (!messages.length) {
      return
    }

    const tooltip = {
      message: messages.length === 1 ? messages[0] : null,
      marker: this.textEditor.markBufferRange([position, position]),
      element: getTooltipElement(messages, this.showProviderName),
    }
    tooltip.marker.onDidDestroy(() => {
      this.tooltip = null
    })
    this.textEditor.decorateMarker(tooltip.marker, {
      type: 'overlay',
      item: tooltip.element,
    })
    this.tooltip = tooltip
  }
  removeTooltip() {
    if (this.tooltip) {
      this.tooltip.marker.destroy()
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
      const markerRange = $range(message)
      if (!markerRange) {
        // Only for backward compatibility
        continue
      }
      const marker = textBuffer.markRange(markerRange, {
        invalidate: 'never',
      })
      this.markers.set(message, marker)
      this.messages.add(message)
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
      this.decorateMarker(message, marker)
    }

    this.updateTooltip(this.cursorPosition)
  }
  decorateMarker(message: LinterMessage, marker: Object) {
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
    this.removeTooltip()
  }
}
