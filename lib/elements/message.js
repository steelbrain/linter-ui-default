'use babel'

import React from 'preact'
import { getMessageClass } from '../helpers'
import type { Linter$Message } from './types'

/** @jsx React.h */

export default class Message extends React.Component {
  render() {
    const message = this.props.message
    const messageClass = getMessageClass(message)
    return <linter-message>
      <span class="linter-message-item badge badge-flexible linter-highlight">
        {message.name}
      </span>
      <span class={`linter-message-item badge badge-flexible linter-highlight ${getMessageClass(message)}`}>
        {message.type}
      </span>
      <MessageLine message={message} />
    </linter-message>
  }
}

export class MessageLine extends React.Component {
  render() {
    const message = this.props.message
    const className = 'linter-message-item'
    return message.html ?
      <linter-message-line class={className} dangerouslySetInnerHTML={message.html} /> :
      <linter-message-line class={className}>{message.text}</linter-message-line>
  }
}
