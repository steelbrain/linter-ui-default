/* @flow */
/** @jsx React.h */

import * as React from 'preact'
import MessageElement from './message' // eslint-disable-line no-unused-vars
import MessageElementLegacy from './message-legacy' // eslint-disable-line no-unused-vars
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
  React.render(<linter-messages>{ children }</linter-messages>, bubble)
  return bubble
}
