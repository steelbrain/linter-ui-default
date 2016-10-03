/* @flow */

import React from 'react'
import { openMessage } from './helpers'
import type { Message } from '../types'

export default class MessageElement extends React.Component {
  props: {
    message: Message,
    showProviderName: boolean,
  };

  render() {
    const { message, showProviderName } = this.props

    return (<linter-message class={message.severity}>
      <linter-excerpt>
        { showProviderName ? `${message.linterName}: ` : '' }
        { message.excerpt }
      </linter-excerpt>{' '}
      <a href="#" onClick={() => openMessage(message)}>
        <span className="icon icon-link linter-icon"></span>
      </a>
    </linter-message>)
  }
}
