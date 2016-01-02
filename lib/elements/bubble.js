'use babel'

/** @jsx vanilla.jsx */
import {CompositeDisposable} from 'atom'
import vanilla from 'vanilla-jsx'
import {getMessageElement} from './message'

export function getBubble(messages) {
  const container = <div id="linter-inline"></div>
  const disposable = new CompositeDisposable()
  const messagesLength = messages.length
  for (let i = 0; i < messagesLength; ++i) {
    const message = messages[i]
    const messageElement = getMessageElement(message, false)
    disposable.add(messageElement)
    container.appendChild(messageElement.element)

    const tracesLength = messages.trace && messages.trace.length
    if (tracesLength)
    for (let tracei = 0; tracei < tracesLength; ++tracei) {
      const traceMessage = message.trace[tracei]
      const traceMessageElement = getMessageElement(traceMessage, true)
      disposable.add(traceMessageElement)
      container.appendChild(traceMessageElement.element)
    }
  }
  return {bubbleElement: container, disposable}
}
