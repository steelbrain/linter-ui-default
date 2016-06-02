'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import Message from './message'
import type { Linter$Message } from '../types'

export function getElement(messages: Set<Linter$Message>, includeProvider: boolean, showCopyButton: boolean): HTMLElement {
  const bubble = document.createElement('div')
  const children = []
  bubble.id = 'linter-inline'
  for (const message of messages) {
    children.push(<Message message={message} includeLink={false} includeCopyLink={showCopyButton} includeProvider={includeProvider} />)
    if (message.trace && message.trace.length) {
      for (const trace of message.trace) {
        children.push(<Message message={trace} includeLink={true} includeCopyLink={showCopyButton} includeProvider={includeProvider} />)
      }
    }
  }
  React.render(<linter-messages>{ children }</linter-messages>, bubble)
  return bubble
}
