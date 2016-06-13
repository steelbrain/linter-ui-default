'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import { shell } from 'electron'
import { visitMessage } from './helpers'

export default class MessageElement extends React.Component {
  /*
    props = {
      message: Message,
      reference: 'external' | 'internal'
    }
  */

  openLink: (() => void) = () => {
    const reference = this.props.reference
    if (reference === 'external') {
      shell.openExternal(
        this.props.message.reference || `https://www.google.com/search?q=${encodeURIComponent(`Linter ${this.props.message.excerpt}`)}`
      )
    } else if (reference === 'internal') {
      visitMessage(this.props.message)
    }
  };

  render() {
    const { message } = this.props

    return (<linter-message className={message.severity}>
      <linter-excerpt>
        { message.excerpt }
      </linter-excerpt>{' '}
      <a href="#" onClick={this.openLink}> >> </a>
    </linter-message>)
  }
}
