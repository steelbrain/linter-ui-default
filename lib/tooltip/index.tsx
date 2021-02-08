import { render } from 'solid-js/web'
import type * as Solid from 'solid-js'
import { CompositeDisposable, Emitter, TextEditorElement } from 'atom'
import type { Disposable, Point, TextEditor, DisplayMarker } from 'atom'
import Delegate from './delegate'
import MessageElement from './message'
import { $range } from '../helpers'
import type { LinterMessage } from '../types'
import { makeOverlaySelectable } from 'atom-ide-base/commons-ui/float-pane/selectable-overlay'

export default class TooltipElement {
  marker: DisplayMarker
  element: HTMLElement = document.createElement('div')
  emitter = new Emitter<{ 'did-destroy': never }>()
  messages: Array<LinterMessage>
  subscriptions: CompositeDisposable = new CompositeDisposable()

  constructor(messages: Array<LinterMessage>, position: Point, textEditor: TextEditor) {
    this.messages = messages
    this.marker = textEditor.markBufferRange([position, position])
    this.marker.onDidDestroy(() => this.emitter.emit('did-destroy'))

    const delegate = new Delegate()

    // make tooltips copyable and selectable
    makeOverlaySelectable(textEditor, this.element)

    this.element.id = 'linter-tooltip'

    textEditor.decorateMarker(this.marker, {
      type: 'overlay',
      item: this.element,
    })

    this.subscriptions.add(this.emitter, delegate)

    const children: Array<Solid.JSX.Element> = []
    messages.forEach(message => {
      if (message.version === 2) {
        children.push(<MessageElement key={message.key} delegate={delegate} message={message} />)
      }
    })
    render(() => <div className="linter-messages">{children}</div>, this.element)

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
      } else {
        // move down so it does not overlap with datatip-overlay
        // @ts-ignore
        const dataTip = (textEditor.getElement() as TextEditorElement).querySelector('.datatip-overlay') as HTMLElement
        if (dataTip) {
          const overlay = this.element.parentElement
          if (overlay) {
            overlay.style.transform = `translateY(${dataTip.clientHeight}px)`
          }
        }
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
  onDidDestroy(callback: () => void): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}
