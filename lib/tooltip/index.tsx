import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable, Emitter } from 'atom'
import type { Disposable, Point, TextEditor, DisplayMarker } from 'atom'

import Delegate from './delegate'
import MessageElement from './message'
import { $range } from '../helpers'
import type { LinterMessage } from '../types'

export default class TooltipElement {
  marker: DisplayMarker
  element: HTMLElement = document.createElement('div')
  emitter: Emitter = new Emitter()
  messages: Array<LinterMessage>
  subscriptions: CompositeDisposable = new CompositeDisposable()

  constructor(messages: Array<LinterMessage>, position: Point, textEditor: TextEditor) {
    this.messages = messages
    this.subscriptions

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

    const children: Array<JSX.Element> = []
    messages.forEach(message => {
      if (message.version === 2) {
        children.push(<MessageElement key={message.key} delegate={delegate} message={message} />)
      }
    })
    ReactDOM.render(<div className="linter-messages">{children}</div>, this.element)

    // move box above the current editing line
    // HACK: patch the decoration's style so it is shown above the current line
    setTimeout(() => {
      const hight = this.element.getBoundingClientRect().height
      const lineHight = textEditor.getLineHeightInPixels()
      // @ts-ignore: internal API
      const availableHight = (position.row - textEditor.getFirstVisibleScreenRow()) * lineHight
      if (hight < availableHight) {
        const overlay = this.element.parentElement
        if (overlay) {
          overlay.style.transform = `translateY(-${2 + lineHight + hight}px)`
        }
        // TODO:
        // } else {
        // // // move right so it does not overlap with datatip-overlay"
        // const dataTip = textEditor.getElement().querySelector(".datatip-overlay")
        // if (dataTip) {
        //   this.element.style.left = dataTip.clientWidth + "px"
        // }
      }
      this.element.style.visibility = 'visible'
    }, 50)
  }
  isValid(position: Point, messages: Map<string, LinterMessage>): boolean {
    if (this.messages.length !== 1 || !messages.has(this.messages[0].key)) {
      return false
    }
    const range = $range(this.messages[0])
    return Boolean(range && range.containsPoint(position))
  }
  onDidDestroy(callback: () => any): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
