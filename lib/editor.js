'use babel'

/* @flow */

import { CompositeDisposable, Emitter } from 'atom'
import debounce from 'sb-debounce'
import disposableEvent from 'disposable-event'
import { getMessagesOnPoint } from './helpers'
import { getElement as getBubbleElement } from './elements/bubble'
import type { Disposable, TextEditor, TextEditorGutter, TextEditorMarker, Point } from 'atom'
import type Buffer from './buffer'

export default class Editor {
  gutter: ?TextEditorGutter;
  buffer: Buffer;
  bubble: ?TextEditorMarker;
  emitter: Emitter;
  textEditor: TextEditor;
  showBubble: boolean;
  subscriptions: CompositeDisposable;

  constructor(textEditor: TextEditor, buffer: Buffer, visibility: boolean) {
    this.bubble = null
    this.buffer = buffer
    this.emitter = new Emitter()
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()
    const editorElement = atom.views.getView(textEditor)

    if (visibility) {
      const position = atom.config.get('linter-ui-default.gutterPosition')
      this.gutter = this.textEditor.addGutter({
        name: 'linter-ui-default',
        priority: position === 'Left' ? -100 : 100
      })
    } else this.gutter = null

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showBubble', showBubble => {
      this.showBubble = showBubble
    }))
    this.subscriptions.add(textEditor.onDidDestroy(() => {
      this.dispose()
    }))
    this.subscriptions.add(disposableEvent(editorElement, 'mousemove', debounce(e => {
      if (editorElement.component) {
        const bufferPosition = textEditor.bufferPositionForScreenPosition(editorElement.component.screenPositionForMouseEvent(e))
        this.updateBubble(bufferPosition)
      } // The property is removed after an editor is disposed
    }, 200)))
  }
  updateBubble(position: ?Point = null) {
    position = position || this.textEditor.getCursorBufferPosition()

    if (this.bubble) {
      this.bubble.destroy()
      this.bubble = null
    }

    const messages = getMessagesOnPoint(this.buffer.messages, this.textEditor.getPath(), position)

    if (messages.size) {
      const bubble = this.textEditor.markBufferRange([position, position])
      this.textEditor.decorateMarker(bubble, {
        type: 'overlay',
        persistent: false,
        item: getBubbleElement(messages)
      })
      this.bubble = bubble
    }
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
    if (this.gutter) {
      this.gutter.destroy()
    }
    if (this.bubble) {
      this.bubble.destroy()
    }
  }
}
