'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import type { Message } from '../types'

export default class MessageElement extends React.Component {
  render() {
    const { message } = this.props
    return (<linter-message className={message.severity}>
      <linter-excerpt>
        { message.excerpt }
      </linter-excerpt>
    </linter-message>)
  }
}
