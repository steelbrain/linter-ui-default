'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import { shell } from 'electron'
import type { Message } from '../types'

export default class MessageElement extends React.Component {
  openLink: (() => void) = () => {
    shell.openExternal(
      this.props.message.reference || `https://www.google.com/search?q=${encodeURIComponent(`Linter ${this.props.message.excerpt}`)}`
    )
  };

  render() {
    const { message } = this.props
    return (<linter-message className={message.severity}>
      <linter-excerpt>
        { message.excerpt }
      </linter-excerpt>{' '}
      <a href="javascript:void" onClick={this.openLink}> >> </a>
    </linter-message>)
  }
}
