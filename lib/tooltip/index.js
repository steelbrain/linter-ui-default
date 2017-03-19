/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Point, TextEditor } from 'atom'
import type { Disposable } from 'sb-event-kit'

import Delegate from './delegate'
import MessageElement from './message'
import MessageElementLegacy from './message-legacy'
import { $range } from '../helpers'
import type { LinterMessage } from '../types'

export default class TooltipElement {
  marker: Object;
  element: HTMLElement;
  emitter: Emitter;
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;

  constructor(messages: Array<LinterMessage>, position: Point, textEditor: TextEditor) {
    this.emitter = new Emitter()
    this.element = document.createElement('div')
    this.messages = messages
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.marker = textEditor.markBufferRange([position, position])
    this.marker.onDidDestroy(() => this.emitter.emit('did-destroy'))

    const delegate = new Delegate()
    this.element.id = 'linter-tooltip'
    textEditor.decorateMarker(this.marker, {
      type: 'overlay',
      item: this.element,
    })
    this.subscriptions.add(delegate)

    const children = []
    const single = messages.length === 1
    messages.forEach((message) => {
      if (message.version === 2) {
        children.push(<MessageElement key={message.key} delegate={delegate} message={message} single={single} />)
        return
      }
      children.push(<MessageElementLegacy key={message.key} delegate={delegate} message={message} single={single} />)
      if (message.trace && message.trace.length) {
        children.push(...message.trace.map((trace, index) =>
          <MessageElementLegacy key={`${trace.key}:trace:${index}`} delegate={delegate} message={trace} single={false} />
        ))
      }
    })
    ReactDOM.render(<linter-messages>{children}</linter-messages>, this.element)
  }
  isValid(position: Point, messages: Set<LinterMessage>): boolean {
    const range = $range(this.messages[0])
    return !!(this.messages.length === 1 && messages.has(this.messages[0]) && range && range.containsPoint(position))
  }
  onDidDestroy(callback: (() => any)): Disposable {
    this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
