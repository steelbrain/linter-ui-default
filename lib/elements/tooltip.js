/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import MessageElement from './message'
import MessageElementLegacy from './message-legacy'
import type { LinterMessage } from '../types'

export default function createElement(messages: Array<LinterMessage>, showProviderName: boolean): HTMLElement {
  const tooltip = document.createElement('div')
  const children = []
  tooltip.id = 'linter-tooltip'
  for (let i = 0, length = messages.length; i < length; i++) {
    const message = messages[i]
    if (message.version === 2) {
      children.push(<MessageElement key={message.key} showProviderName={showProviderName} message={message} />)
    } else {
      children.push(<MessageElementLegacy key={message.key} showProviderName={showProviderName} message={message} />)
      if (message.trace) {
        message.trace.forEach(function(trace, index) {
          children.push(<MessageElementLegacy key={`${message.key}:trace:${index}`} showProviderName={showProviderName} message={trace} />)
        })
      }
    }
  }
  ReactDOM.render(<linter-messages>{ children }</linter-messages>, tooltip)
  return tooltip
}
