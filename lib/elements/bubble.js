'use babel'

import type { Linter$Message } from './types'

export function getElement(messages: Set<Linter$Message>): HTMLElement {
  const element = document.createElement('div')
  return element
}
