import { debounce, $range, filterMessagesByRangeOrPoint } from '../helpers'
import disposableEvent from 'disposable-event'
import { TargetWithAddEventListener } from 'disposable-event/src/target'
import { CompositeDisposable, Disposable, Emitter, Range, CursorPositionChangedEvent } from 'atom'
const { config, views } = atom
type CompositeDisposableType = CompositeDisposable & { disposed: boolean }

// $FlowIgnore: Cursor is a type
import type { TextEditor, DisplayMarker, Marker, Gutter, Point, Cursor } from 'atom'

import Tooltip from '../tooltip'

import { hasParent, mouseEventNearPosition, getBufferPositionFromMouseEvent } from './helpers'
import type { LinterMessage } from '../types'

export default class Editor {
  textEditor: TextEditor
  gutter: Gutter | null = null
  tooltip: Tooltip | null = null
  emitter = new Emitter<{ 'did-destroy': never }>()
  markers = new Map<string, Array<DisplayMarker | Marker>>()
  messages = new Map<string, LinterMessage>()
  showTooltip: boolean = true
  subscriptions = new CompositeDisposable() as CompositeDisposableType
  cursorPosition: Point | null = null
  gutterPosition?: string
  tooltipFollows: string = 'Both'
  showDecorations?: boolean
  showProviderName: boolean = true
  ignoreTooltipInvocation: boolean = false
  currentLineMarker: DisplayMarker | null = null
  lastRange?: Range
  lastIsEmpty?: boolean
  lastCursorPositions = new WeakMap<Cursor, Point>()

  constructor(textEditor: TextEditor) {
    this.textEditor = textEditor

    let tooltipSubscription: CompositeDisposable | null = null

    this.subscriptions.add(
      this.emitter,
      textEditor.onDidDestroy(() => {
        this.dispose()
      }),
      new Disposable(function () {
        tooltipSubscription?.dispose()
      }),
      // configs
      config.observe('linter-ui-default.showProviderName', (showProviderName: boolean) => {
        this.showProviderName = showProviderName
      }),
      config.observe('linter-ui-default.showDecorations', (showDecorations: boolean) => {
        const notInitial = typeof this.showDecorations !== 'undefined'
        this.showDecorations = showDecorations
        if (notInitial) {
          this.updateGutter()
        }
      }),
      // gutter config
      config.observe('linter-ui-default.gutterPosition', (gutterPosition: string | undefined) => {
        const notInitial = typeof this.gutterPosition !== 'undefined'
        this.gutterPosition = gutterPosition
        if (notInitial) {
          this.updateGutter()
        }
      }),
      // tooltip config
      config.observe('linter-ui-default.showTooltip', (showTooltip: boolean) => {
        this.showTooltip = showTooltip
        if (!showTooltip && this.tooltip !== null) {
          this.removeTooltip()
        }
      }),
      config.observe('linter-ui-default.tooltipFollows', (tooltipFollows: string) => {
        this.tooltipFollows = tooltipFollows
        tooltipSubscription?.dispose()
        tooltipSubscription = new CompositeDisposable()
        if (tooltipFollows === 'Mouse' || tooltipFollows === 'Both') {
          tooltipSubscription.add(this.listenForMouseMovement())
        }
        if (tooltipFollows === 'Keyboard' || tooltipFollows === 'Both') {
          tooltipSubscription.add(this.listenForKeyboardMovement())
        }
        this.removeTooltip()
      }),
      // cursor position change
      textEditor.onDidChangeCursorPosition(({ cursor, newBufferPosition }) => {
        const lastBufferPosition = this.lastCursorPositions.get(cursor)
        if (lastBufferPosition === undefined || !lastBufferPosition.isEqual(newBufferPosition)) {
          this.lastCursorPositions.set(cursor, newBufferPosition)
          this.ignoreTooltipInvocation = false
        }
        if (this.tooltipFollows === 'Mouse') {
          this.removeTooltip()
        }
      }),
      // text change
      textEditor.getBuffer().onDidChangeText(() => {
        const cursors = textEditor.getCursors()
        for (const cursor of cursors) {
          this.lastCursorPositions.set(cursor, cursor.getBufferPosition())
        }
        if (this.tooltipFollows !== 'Mouse') {
          this.ignoreTooltipInvocation = true
          this.removeTooltip()
        }
      }),
    )
    this.updateGutter()
    this.listenForCurrentLine()
  }
  listenForCurrentLine() {
    this.subscriptions.add(
      this.textEditor.observeCursors(cursor => {
        const handlePositionChange = ({ start, end }: { start: Point; end: Point }) => {
          const gutter = this.gutter
          if (gutter === null || this.subscriptions.disposed) {
            return
          }
          // We need that Range.fromObject hack below because when we focus index 0 on multi-line selection
          // end.column is the column of the last line but making a range out of two and then accesing
          // the end seems to fix it (black magic?)
          const currentRange = Range.fromObject([start, end])
          const linesRange = Range.fromObject([
            [start.row, 0],
            [end.row, Infinity],
          ])
          const currentIsEmpty = currentRange.isEmpty()

          // NOTE: Atom does not paint gutter if multi-line and last line has zero index
          if (start.row !== end.row && currentRange.end.column === 0) {
            linesRange.end.row--
          }
          if (this.lastRange?.isEqual(linesRange) === true && currentIsEmpty === this.lastIsEmpty) {
            return
          }
          if (this.currentLineMarker) {
            this.currentLineMarker.destroy()
            this.currentLineMarker = null
          }
          this.lastRange = linesRange
          this.lastIsEmpty = currentIsEmpty

          this.currentLineMarker = this.textEditor.markScreenRange(linesRange, {
            invalidate: 'never',
          })
          const item = document.createElement('span')
          item.className = `line-number cursor-line linter-cursor-line ${currentIsEmpty ? 'cursor-line-no-selection' : ''}`
          gutter.decorateMarker(this.currentLineMarker, {
            item,
            class: 'linter-row',
          })
        }

        const cursorMarker = cursor.getMarker()
        const subscriptions = new CompositeDisposable()
        subscriptions.add(
          cursorMarker.onDidChange(({ newHeadScreenPosition, newTailScreenPosition }) => {
            handlePositionChange({
              start: newHeadScreenPosition,
              end: newTailScreenPosition,
            })
          }),
          cursor.onDidDestroy(() => {
            this.subscriptions.remove(subscriptions)
            subscriptions.dispose()
          }),
          new Disposable(() => {
            if (this.currentLineMarker) {
              this.currentLineMarker.destroy()
              this.currentLineMarker = null
            }
          }),
        )
        this.subscriptions.add(subscriptions)
        handlePositionChange(cursorMarker.getScreenRange())
      }),
    )
  }
  listenForMouseMovement() {
    const editorElement = views.getView(this.textEditor)

    return disposableEvent(
      (editorElement as unknown) as TargetWithAddEventListener,
      'mousemove',
      debounce((event: MouseEvent) => {
        if (this.subscriptions.disposed || !hasParent(event.target as HTMLElement | null, 'div.scroll-view')) {
          return
        }
        const tooltip = this.tooltip
        if (
          tooltip !== null &&
          mouseEventNearPosition({
            event,
            editor: this.textEditor,
            editorElement,
            tooltipElement: tooltip.element,
            screenPosition: tooltip.marker.getStartScreenPosition(),
          })
        ) {
          return
        }

        this.cursorPosition = getBufferPositionFromMouseEvent(event, this.textEditor, editorElement)
        this.ignoreTooltipInvocation = false
        if (this.cursorPosition) {
          this.updateTooltip(this.cursorPosition)
        } else {
          this.removeTooltip()
        }
      }, 100),
      { passive: true },
    )
  }
  listenForKeyboardMovement() {
    return this.textEditor.onDidChangeCursorPosition(
      debounce(({ newBufferPosition }: CursorPositionChangedEvent) => {
        this.cursorPosition = newBufferPosition
        this.updateTooltip(newBufferPosition)
      }, 16),
    )
  }
  updateGutter() {
    this.removeGutter()
    if (this.showDecorations !== true) {
      this.gutter = null
      return
    }
    const priority = this.gutterPosition === 'Left' ? -100 : 100
    this.gutter = this.textEditor.addGutter({
      name: 'linter-ui-default',
      priority,
    })
    for (const [key, markers] of this.markers) {
      const message = this.messages.get(key)
      if (message) {
        for (const marker of markers) {
          this.decorateMarker(message, marker, 'gutter')
        }
      }
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
  updateTooltip(position: Point | null | undefined) {
    if (!position || this.tooltip?.isValid(position, this.messages) === true) {
      return
    }
    this.removeTooltip()
    if (!this.showTooltip) {
      return
    }
    if (this.ignoreTooltipInvocation) {
      return
    }

    const messages = filterMessagesByRangeOrPoint(this.messages, this.textEditor.getPath(), position)
    if (messages.length === 0) {
      return
    }

    this.tooltip = new Tooltip(messages, position, this.textEditor)
    const tooltipMarker = this.tooltip.marker
    // save markers of the tooltip (for destorying them in this.applyChanges)
    for (const message of messages) {
      this.saveMarker(message.key, tooltipMarker)
    }

    // $FlowIgnore: this.tooltip is not null
    this.tooltip.onDidDestroy(() => {
      this.tooltip = null
    })
  }
  removeTooltip() {
    this.tooltip?.marker.destroy()
  }
  applyChanges(added: Array<LinterMessage>, removed: Array<LinterMessage>) {
    const textBuffer = this.textEditor.getBuffer()

    for (let i = 0, length = removed.length; i < length; i++) {
      const message = removed[i]
      this.destroyMarker(message.key)
    }

    for (let i = 0, length = added.length; i < length; i++) {
      const message = added[i]
      const markerRange = $range(message)
      if (!markerRange) {
        // Only for backward compatibility
        continue
      }
      // TODO this marker is Marker no DisplayMarker!!
      const marker: Marker = textBuffer.markRange(markerRange, {
        invalidate: 'never',
      })
      this.decorateMarker(message, marker)
      marker.onDidChange(({ oldHeadPosition, newHeadPosition, isValid }) => {
        if (!isValid || (newHeadPosition.row === 0 && oldHeadPosition.row !== 0)) {
          return
        }
        if (message.version === 2) {
          message.location.position = marker.previousEventState.range
        }
      })
    }

    this.updateTooltip(this.cursorPosition)
  }
  decorateMarker(message: LinterMessage, marker: DisplayMarker | Marker, paint: 'gutter' | 'editor' | 'both' = 'both') {
    this.saveMarker(message.key, marker)
    this.messages.set(message.key, message)

    if (paint === 'both' || paint === 'editor') {
      this.textEditor.decorateMarker(marker, {
        type: 'text',
        class: `linter-highlight linter-${message.severity}`,
      })
    }

    const gutter = this.gutter
    if (gutter && (paint === 'both' || paint === 'gutter')) {
      const element = document.createElement('span')
      element.className = `linter-gutter linter-gutter-${message.severity} icon icon-${message.icon ?? 'primitive-dot'}`
      gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: element,
      })
    }
  }

  // add marker to the message => marker map
  saveMarker(key: string, marker: DisplayMarker | Marker) {
    const allMarkers = this.markers.get(key) ?? []
    allMarkers.push(marker)
    this.markers.set(key, allMarkers)
  }

  // destroy markers of a key
  destroyMarker(key: string) {
    const markers = this.markers.get(key)
    if (markers) {
      for (const marker of markers) {
        marker?.destroy()
      }
    }
    this.markers.delete(key)
    this.messages.delete(key)
  }

  onDidDestroy(callback: () => void) {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
    this.removeGutter()
    this.removeTooltip()
  }
}
