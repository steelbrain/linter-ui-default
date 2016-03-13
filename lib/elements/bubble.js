'use babel'

/* @flow */

import type { Linter$Message } from '../types'
import { getElement as getMessageElement } from './message'

export function getElement(messages: Set<Linter$Message>, includeProvider: boolean): HTMLElement {
  const bubble = document.createElement('div')
  bubble.id = 'linter-inline'
  for (const message of messages) {
    bubble.appendChild(getMessageElement(message, false, includeProvider))
    if (message.trace && message.trace.length) {
      for (const trace of message.trace) {
        bubble.appendChild(getMessageElement(trace, true, includeProvider))
      }
    }
  }
  return bubble
}
