'use babel'

// Todo: (future) Determine the max based on past counts
export const MessageCacheMax = 250
// ^ Max Number of messages to keep at disposal
export const MessageCache = []

export class MessageElement {
  constructor() {
    this.element = document.createElement('linter-message')
    this.elementName = document.createElement('span')
    this.elementType = document.createElement('span')
    this.elementMessage = document.createElement('linter-message-line')
    // Todo: Support multi-line messages
    // Todo: Support navigational links

    this.element.appendChild(this.elementName)
    this.element.appendChild(this.elementType)
    this.element.appendChild(this.elementMessage)

    this.elementMessage.className = 'linter-message-item'
    this.elementName.className = 'linter-message-item badge badge-flexible linter-highlight'
  }

  attach(message) {
    if (message.name) {
      this.elementName.textContent = message.name
    } else {
      this.elementName.setAttribute('hidden', 'true')
    }

    if (message.text) {
      this.elementMessage.textContent = message.text
    } else if (message.html) {
      this.elementMessage.innerHTML = message.html
    }

    this.elementType.textContent = message.type
    this.elementType.className = `linter-message-item badge badge-flexible linter-highlight ${message.class}`

    return this
  }

  dispose() {
    if (MessageCache.length < MessageCacheMax) {
      MessageCache.push(this)
      this.elementName.removeAttribute('hidden')
    } else {
      this.element = null
      this.elementName = null
      this.elementType = null
      this.elementMessage = null
    }
  }
}

export function getMessageElement(message) {
  return (MessageCache.length ? MessageCache.pop() : new MessageElement()).attach(message)
}
