'use babel'

/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {getMessageElement} from './message'

export function getBubble(message) {
  // Todo: Support traces
  const messageElement = getMessageElement(message, false)
  const bubbleElement = <div id="linter-inline">{messageElement.element}</div>
  return {bubbleElement, messageElement}
}
