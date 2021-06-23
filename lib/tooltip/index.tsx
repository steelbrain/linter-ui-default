import { For, Show, render } from 'solid-js/web'
import { CompositeDisposable, Emitter, TextEditorElement } from 'atom'
import type { Disposable, Point, TextEditor, DisplayMarker } from 'atom'
import Delegate from './delegate'
import MessageElement from './message'
import { $range } from '../helpers'
import type { LinterMessage } from '../types'
import { makeOverlaySelectable } from 'atom-ide-base/commons-ui/float-pane/selectable-overlay'

export default class Tooltip {
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

    render(() => <TooltipElement messages={messages} delegate={delegate} />, this.element)
    moveElement(this.element, position, textEditor)
  }

  isValid(position: Point, messages: Map<string, LinterMessage>): boolean {
    if (this.messages.length !== 1 || !messages.has(this.messages[0].key)) {
      return false
    }
    const range = $range(this.messages[0])
    return range?.containsPoint(position) === true
  }
  onDidDestroy(callback: () => void): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.subscriptions.dispose()
  }
}

interface TooltipElementProps {
  messages: LinterMessage[]
  delegate: Delegate
}

function TooltipElement(props: TooltipElementProps) {
  return (
    <div className="linter-messages">
      <For each={props.messages}>
        {message => (
          <Show when={message.version === 2}>
            <MessageElement key={message.key} delegate={props.delegate} message={message} />
          </Show>
        )}
      </For>
    </div>
  )
}

/** Move box above the current editing line */
// HACK: patch the decoration's style so it is shown above the current line
function moveElement(element: HTMLElement, position: Point, textEditor: TextEditor) {
  setTimeout(() => {
    const hight = element.getBoundingClientRect().height
    const lineHight = textEditor.getLineHeightInPixels()
    // @ts-ignore: internal API
    const availableHight = (position.row - textEditor.getFirstVisibleScreenRow()) * lineHight
    if (hight < availableHight) {
      const overlay = element.parentElement
      if (overlay !== null) {
        overlay.style.transform = `translateY(-${2 + lineHight + hight}px)`
      }
    } else {
      // move down so it does not overlap with datatip-overlay
      // @ts-ignore
      const dataTip = (textEditor.getElement() as TextEditorElement).querySelector<HTMLElement>('.datatip-overlay')
      if (dataTip !== null) {
        const overlay = element.parentElement
        if (overlay !== null) {
          overlay.style.transform = `translateY(${dataTip.clientHeight}px)`
        }
      }
    }
    element.style.visibility = 'visible'
  }, 50)
}
