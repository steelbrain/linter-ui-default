'use babel'

/* @flow */

import { getMessageClass, getMessageRange } from '../helpers'
import type { Linter$Message } from '../types'

const NewLine = /\r?\n/

export class Message {
  message: Linter$Message;
  element: HTMLElement;
  includeLink: boolean;

  constructor(message: Linter$Message, includeLink: boolean = true, includeProvider: boolean = true) {
    this.message = message
    this.element = document.createElement('linter-message')
    this.includeLink = includeLink

    if (includeProvider && this.message.name) {
      this.element.appendChild(Message.getName(this.message))
    }
    this.element.appendChild(Message.getRibbon(this.message))
    this.element.appendChild(Message.getMessage(this.message, this.includeLink))
  }
  static getMessage(message, includeLink) {
    if (message.multiline || NewLine.test(message.text || '')) {
      return Message.getMultiLineMessage(message, includeLink)
    }

    const element = document.createElement('span')
    const messageElement = document.createElement('linter-message-line')

    element.className = 'linter-message-item'

    element.appendChild(messageElement)

    if (includeLink && message.filePath) {
      element.appendChild(Message.getLink(message))
    }

    if (message.html && typeof message.html !== 'string') {
      messageElement.appendChild(message.html.cloneNode(true))
    } else if (message.html) {
      messageElement.innerHTML = message.html
    } else if (message.text) {
      messageElement.textContent = message.text
    }

    return element
  }
  static getMultiLineMessage(message, includeLink) {
    const container = document.createElement('span')
    const messageElement = document.createElement('linter-multiline-message')

    container.className = 'linter-message-item'
    messageElement.setAttribute('title', message.text)

    if (message.text) {
      message.text.split(NewLine).forEach(function(line, index) {
        if (!line) return

        const el = document.createElement('linter-message-line')
        el.textContent = line
        messageElement.appendChild(el)

        // Render the link in the "title" line.
        if (index === 0 && includeLink && message.filePath) {
          messageElement.appendChild(Message.getLink(message))
        }
      })
    }

    container.appendChild(messageElement)

    messageElement.addEventListener('click', function(e) {
      // Avoid opening the message contents when we click the link.
      const link = e.target.tagName === 'A' ? e.target : e.target.parentNode

      if (!link.classList.contains('linter-message-link')) {
        messageElement.classList.toggle('expanded')
      }
    })

    return container
  }
  static getLink(message) {
    const linkElement = document.createElement('a')
    const pathElement = document.createElement('span')
    const messageRange = getMessageRange(message)

    linkElement.className = 'linter-message-link'
    if (messageRange) {
      linkElement.textContent = `at line ${messageRange.start.row + 1} col ${messageRange.start.column + 1}`
    }
    pathElement.textContent = ` in ${atom.project.relativizePath(message.filePath)[1]}`
    linkElement.appendChild(pathElement)
    linkElement.addEventListener('click', function() {
      atom.workspace.open(message.filePath).then(function() {
        if (messageRange) {
          atom.workspace.getActiveTextEditor().setCursorBufferPosition(messageRange.start)
        }
      })
    })
    return linkElement
  }
  static getName(message) {
    const element = document.createElement('span')
    element.className = 'linter-message-item badge badge-flexible linter-highlight'
    element.textContent = message.name
    return element
  }
  static getRibbon(message) {
    const element = document.createElement('span')
    const messageClass = getMessageClass(message)
    element.className = `linter-message-item badge badge-flexible linter-highlight ${messageClass}`
    element.textContent = message.type
    return element
  }
}

export function getElement(message: Linter$Message, includeLink: boolean): HTMLElement {
  return new Message(message, includeLink).element
}
