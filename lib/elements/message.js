'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import type { Message } from '../types'

export default class MessageElement extends React.Component {
  static getSingleLineMessage(message: Message) {
    return (<span>
      <linter-message-line>
        { message.excerpt }
      </linter-message-line>
    </span>)
  }

  render() {
    const { message } = this.props
    return (<linter-message>
      { MessageElement.getSingleLineMessage(message) }
    </linter-message>)
  }
}
