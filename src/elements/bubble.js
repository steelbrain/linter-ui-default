/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
// eslint-disable-next-line no-unused-vars
import MessageElement from './message'
// eslint-disable-next-line no-unused-vars
import MessageElementLegacy from './message-legacy'
import type { LinterMessage } from '../types'

export default function getElement(messages: Array<LinterMessage>, showProviderName: boolean): HTMLElement {
  const bubble = document.createElement('div')
  const children = []
  bubble.id = 'linter-tooltip'
  for (const message of (messages: Array<LinterMessage>)) {
    if (message.version === 2) {
      children.push(<MessageElement showProviderName={showProviderName} message={message} />)
    } else {
      children.push(<MessageElementLegacy showProviderName={showProviderName} message={message} />)
    }
  }
  ReactDOM.render(<linter-messages>{ children }</linter-messages>, bubble)
  return bubble
}
