'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import type { Linter$Message } from '../types'

let MESSAGE_NUMBER = 0

export default class Message extends React.Component {
  static getSingleLineMessage(message: Linter$Message, includeLink: boolean) {
    const number = ++MESSAGE_NUMBER
    const elementID = `linter-message-${number}`
    const isElement = message.html && typeof message.html === 'object'
    if (isElement) {
      setImmediate(function() {
        const element = document.getElementById(elementID)
        if (element) {
          // $FlowIgnore: This is an HTML Element :\
          element.appendChild(message.html.cloneNode(true))
        } else {
          console.warn('[Linter] Unable to get element for mounted message', number, message)
        }
      })
    }

    return (<span>
      <linter-message-line id={elementID} dangerouslySetInnerHTML={ !isElement && message.html ? { __html: message.html } : null }>
        { message.text }
      </linter-message-line>
      { includeLink && message.filePath ? Message.getLink(message) : null }
    </span>)
  }

  render() {
    const { message } = this.props
    return (<linter-message>
      { Message.getSingleLineMessage(message) }
    </linter-message>)
  }
}
