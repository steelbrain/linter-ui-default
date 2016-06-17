'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import { shell } from 'electron'
import { visitMessage } from './helpers'
import type { Message } from '../types'

export default class MessageElement extends React.Component {
  props: {
    message: Message,
    reference: 'external' | 'internal',
    showProviderName: boolean,
  };

  openLink: (() => void) = () => {
    const reference = this.props.reference;
    if (reference === 'external') {
      shell.openExternal(
        this.props.message.reference || `https://www.google.com/search?q=${encodeURIComponent(`${this.props.message.linterName} ${this.props.message.excerpt}`)}`
      )
    } else {
      visitMessage(this.props.message)
    }
  };

  render() {
    const { message, showProviderName } = this.props

    return (<linter-message className={message.severity}>
      <linter-excerpt>
        { showProviderName ? `${message.linterName}: ` : '' }
        { message.excerpt }
      </linter-excerpt>{' '}
      <a href="#" onClick={this.openLink}>
        { this.props.reference === 'external' ?
          <span className="icon icon-search linter-icon"></span> :
          <span className="icon icon-code linter-icon"></span>
        }
      </a>
    </linter-message>)
  }
}
