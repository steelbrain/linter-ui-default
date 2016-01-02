'use babel'

import {Disposable} from 'atom'

// Todo: (future) Determine the max based on past counts
export const MessageCacheMax = 250
// ^ Max Number of messages to keep at disposal
export const MessageCache = []

const showProvider = atom.config.get('linter-ui-default.showProviderNames')

export class MessageElement {
  constructor() {
    this.element = document.createElement('linter-message')
    this.elementName = document.createElement('span')
    this.elementType = document.createElement('span')
    this.elementMessage = document.createElement('linter-message-line')
    this.elementLink = document.createElement('a')
    // Todo: Support multi-line messages
    this.linkCallback = null

    this.element.appendChild(this.elementName)
    this.element.appendChild(this.elementType)
    this.element.appendChild(this.elementMessage)
    this.element.appendChild(this.elementLink)

    this.elementMessage.className = 'linter-message-item'
    this.elementName.className = 'linter-message-item badge badge-flexible linter-highlight'
  }

  attach(message, showLink) {
    if (message.name && showProvider) {
      this.elementName.textContent = message.name
    } else {
      this.elementName.setAttribute('hidden', 'true')
    }

    if (message.text) {
      this.elementMessage.textContent = message.text
    } else if (message.html) {
      this.elementMessage.innerHTML = message.html
    }

    if (message.filePath && showLink) {
      const filePath = atom.project.relativizePath(message.filePath)[1]
      let text
      if (message.range) {
        text = `at line ${message.range.start.row + 1} col ${message.range.start.column + 1} in ${filePath}`
      } else {
        text = `in ${filePath}`
      }

      this.elementLink.textContent = text
      this.linkCallback = MessageElement.attachLink(this.elementLink, message.filePath, message.range ? message.range.start : null)
    } else {
      this.elementLink.textContent = ''
    }

    this.elementType.textContent = message.type
    this.elementType.className = `linter-message-item badge badge-flexible linter-highlight ${message.class}`

    return this
  }

  dispose() {
    if (MessageCache.length < MessageCacheMax) {
      MessageCache.push(this)
      this.elementName.removeAttribute('hidden')
      if (this.linkCallback) {
        this.elementLink.removeEventListener('click', this.linkCallback)
        this.linkCallback = null
      }
    } else {
      this.element = null
      this.elementName = null
      this.elementType = null
      this.elementMessage = null
    }
  }

  static attachLink(element, filePath, startRange) {
    const callback = function() {
      atom.workspace.open(filePath).then(function() {
        if (startRange !== null) {
          atom.workspace.getActiveTextEditor().setCursorBufferPosition(startRange)
        }
      })
    }
    element.addEventListener('click', callback)
    element = null
    return callback
  }
}

export function getMessageElement(message, showLink = true) {
  return (MessageCache.length ? MessageCache.pop() : new MessageElement()).attach(message, showLink)
}
