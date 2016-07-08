'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import MessageElement from './message'
import MessageElementLegacy from './message-legacy'
import type { Message, MessageLegacy } from '../types'

export function getElement(messages: Array<Message | MessageLegacy>, showProviderName: boolean): HTMLElement {
  const bubble = document.createElement('div')
  const children = []
  bubble.id = 'linter-tooltip'
  for (let i = 0, length = messages.length, message; i < length; ++i) {
    message = messages[i]
    if (message.version === 2) {
      children.push(<MessageElement showProviderName={showProviderName} message={message} />)
    } else {
      children.push(<MessageElementLegacy showProviderName={showProviderName} message={message} />)
    }
  }
  React.render(<linter-messages>{ children }</linter-messages>, bubble)
  return bubble
}
