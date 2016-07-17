/* @flow */

import type { LinterMessage } from '../types'

// Code Point 160 === &nbsp;
const replacementRegex = new RegExp(String.fromCodePoint(160), 'g')

export function visitMessage(message: LinterMessage) {
  const messageFile = message.version === 1 ? message.filePath : message.location.file
  const messageRange = message.version === 1 ? message.range : message.location.position
  atom.workspace.open(messageFile, { searchAllPanes: true }).then(function() {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor && textEditor.getPath() === messageFile && messageRange) {
      textEditor.setCursorBufferPosition(messageRange.start)
    }
  })
}

export function htmlToText(html: any) {
  const element = document.createElement('div')
  if (typeof html === 'string') {
    element.innerHTML = html
  } else {
    element.appendChild(html.cloneNode(true))
  }
  // NOTE: Convert &nbsp; to regular whitespace
  return element.textContent.replace(replacementRegex, ' ')
}
