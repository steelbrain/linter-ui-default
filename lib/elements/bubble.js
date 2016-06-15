'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import MessageElement from './message'
import type { Message } from '../types'

export function getElement(messages: Set<Message>, showProviderName: boolean): HTMLElement {
  const bubble = document.createElement('div')
  const children = []
  bubble.id = 'linter-tooltip'
  for (const message of messages) {
    children.push(<MessageElement reference="external" showProviderName={showProviderName} message={message} />)
  }
  React.render(<linter-messages>{ children }</linter-messages>, bubble)
  return bubble
}
