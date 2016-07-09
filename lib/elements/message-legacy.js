'use babel'

/* @flow */
/** @jsx React.h */

import React from 'preact'
import { shell } from 'electron'
import { htmlToText } from './helpers'
import type { MessageLegacy } from '../types'

const NEWLINE = /\r\n|\n/
let MESSAGE_NUMBER = 0

export default class Message extends React.Component {
  props: {
    message: MessageLegacy,
    reference: 'external' | 'internal',
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
    chunks.forEach(function(chunk) {
      chunk = chunk.trim()
      if (chunk.length) {
        children.push(<linter-message-line>{ chunk }</linter-message-line>)
      }
    })
    return (<span>
      <linter-multiline-message onClick={function onClick(e) {
        const link = e.target.tagName === 'A' ? e.target : e.target.parentNode

        if (!link.classList.contains('linter-message-link')) {
          this.classList.toggle('expanded')
        }
      }}>{ children }</linter-multiline-message>
    </span>)
  }

  openLink: (() => void) = () => {
    shell.openExternal(
      this.props.message.reference || `https://www.google.com/search?q=${encodeURIComponent(`${this.props.message.linterName} ${this.props.message.text || htmlToText(this.props.message.html)}`)}`
    )
  };

  render() {
    const { message, showProviderName } = this.props
    return (<linter-message className={message.severity}>
      { showProviderName ? `${message.linterName}: ` : '' }
      { message.multiline || NEWLINE.test(message.text || '') ?
        Message.getMultiLineMessage(message) :
        Message.getSingleLineMessage(message)}
      {' '}
      <a href="#" onClick={this.openLink}>
        <span className="icon icon-search linter-icon"></span>
      </a>
    </linter-message>)
  }
}
