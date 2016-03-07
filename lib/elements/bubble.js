'use babel'

import type { Linter$Message } from './types'
import React from 'preact'
import Message from './message'

/** @jsx React.h */

export function getElement(messages: Set<Linter$Message>): HTMLElement {
  const element = document.createElement('div')
  React.render(<Bubble messages={messages} />, element)
  return element
}

export class Bubble extends React.Component {
  render() {
    const messages = []
    for (const message of this.props.messages) {
      messages.push(<Message message={message} />)
    }
    return <div id="linter-inline">
      {messages}
    </div>
  }
}
