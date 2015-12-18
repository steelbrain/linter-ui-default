'use babel'

/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'

// Todo: (future) Determine the max based on past counts
export const MessageCacheMax = 250
// ^ Max Number of messages to keep at disposal
export const MessageCache = []

export class MessageElement {
  constructor() {
    this.element = <linter-message></linter-message>
    this.elementName = <span class="linter-message-item badge badge-flexible linter-highlight"></span>
    this.elementType = <span class="linter-message-item badge badge-flexible linter-highlight"></span>
    this.elementMessage = <linter-message-line class="linter-message-item"></linter-message-line>
    // ^ Todo: Support multi-line messages here
    // Todo: Support navigational links
    // Todo: Support traces

    this.element.appendChild(this.elementName)
    this.element.appendChild(this.elementType)
    this.element.appendChild(this.elementMessage)
  }

  attach(message) {
    if (message.linter) {
      this.elementName.textContent = message.linter
    } else {
      this.elementName.setAttribute('hidden', 'true')
    }

    if (message.text) {
      this.elementMessage.textContent = message.text
    } else if (message.html) {
      this.elementMessage.innerHTML = message.html
    }

    return this
  }

  dispose() {
    this.message = null
  }
  recycle() {
    this.dispose()
    if (MessageCache.length < MessageCacheMax) {
      MessageCache.push(this)
    }
    this.elementName.removeAttribute('hidden')
  }
}

export function getMessageElement(message) {
  return (MessageCache.length ? MessageCache.pop() : new MessageElement()).attach(message)
}
