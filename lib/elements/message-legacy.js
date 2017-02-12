/* @flow */

import React from 'react'
import { openExternally } from './helpers'
import type { MessageLegacy } from '../types'

const NEWLINE = /\r\n|\n/
let MESSAGE_NUMBER = 0

export default class Message extends React.Component {
  props: {
    message: MessageLegacy,
    showProviderName: boolean,
  };

  static getSingleLineMessage(message: MessageLegacy) {
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
    </span>)
  }
  static getMultiLineMessage(message: MessageLegacy) {
    const chunks = message.text ? message.text.split(NEWLINE) : []
    const children = []
    chunks.forEach(function(givenChunk) {
      const chunk = givenChunk.trim()
      if (chunk.length) {
        children.push(<linter-message-line>{ chunk }</linter-message-line>)
      }
    })
    // TODO: Confirm support for multi-line messages
    return (<span>
      <linter-multiline-message onClick={function onClick(e) {
        const link = e.target.tagName === 'A' ? e.target : e.target.parentNode

        if (!link.classList.contains('linter-message-line')) {
          this.classList.toggle('expanded')
        }
      }}>{ children }</linter-multiline-message>
    </span>)
  }

  render() {
    const { message, showProviderName } = this.props
    return (<linter-message class={message.severity}>
      { showProviderName ? `${message.linterName}: ` : '' }
      { NEWLINE.test(message.text || '') ?
        Message.getMultiLineMessage(message) :
        Message.getSingleLineMessage(message)}
      {' '}
      <a href="#" onClick={() => openExternally(message)}>
        <span className="icon icon-link linter-icon"></span>
      </a>
    </linter-message>)
  }
}
