/* @flow */

import React from 'react'
import { visitMessage } from '../helpers'
import { openExternally } from './helpers'
import type { Message } from '../types'

// TODO: Implement description support
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
      { message.reference && message.reference.file && (
        <a href="#" onClick={() => visitMessage(message, true)}>
          <span className="icon icon-alignment-aligned-to linter-icon"></span>
        </a>
      )}
      <a href="#" onClick={() => openExternally(message)}>
        <span className="icon icon-link linter-icon"></span>
      </a>
    </linter-message>)
  }
}
