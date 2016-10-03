/* @flow */

// $FlowIgnore: It's an atom magic module
import { shell } from 'electron'
import type { LinterMessage } from '../types'

// NOTE: Code Point 160 === &nbsp;
const replacementRegex = new RegExp(String.fromCodePoint(160), 'g')

export function htmlToText(html: any): string {
  const element = document.createElement('div')
  if (typeof html === 'string') {
    element.innerHTML = html
  } else {
    element.appendChild(html.cloneNode(true))
  }
  // NOTE: Convert &nbsp; to regular whitespace
  return element.textContent.replace(replacementRegex, ' ')
}

export function openMessage(message: LinterMessage): void {
  let link
  if (message.version === 2 && message.excerpt) {
    link = message.reference
  } else {
    const searchTerm = `${message.linterName} ${message.excerpt || message.text || htmlToText(message.html || '')}`
    // $FlowIgnore: Flow has a bug where it thinks the above line produces a mixed result instead of string
    link = `https://google.com/search?q=${encodeURIComponent(searchTerm)}`
  }
  shell.openExternal(link)
}
