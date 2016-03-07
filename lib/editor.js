'use babel'

/* @flow */

import debounce from 'sb-debounce'
import { CompositeDisposable, Emitter } from 'atom'
import type { Disposable, TextEditor, TextBuffer, TextEditorGutter } from 'atom'
import type Buffer from './buffer'

export default class Editor {
  gutter: ?TextEditorGutter;
  buffer: Buffer;
  emitter: Emitter;
  textEditor: TextEditor;
  showBubble: boolean;
  subscriptions: CompositeDisposable;
  debouncedUpdateBubble: (() => void);

  constructor(textEditor: TextEditor, buffer: Buffer, visibility: boolean) {
    this.buffer = buffer
    this.emitter = new Emitter()
    this.textEditor = textEditor
    this.subscriptions = new CompositeDisposable()

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
    this.subscriptions.add(textEditor.onDidChangeCursorPosition(({newBufferPosition}) => {
      this.debouncedUpdateBubble()
    }))
    this.debouncedUpdateBubble = debounce(this.updateBubble, 60)
  }
  updateBubble() {
    console.log('updateBubble')
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
  }
}
