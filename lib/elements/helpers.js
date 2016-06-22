'use babel'

/* @flow */

import type { Message, MessageLegacy } from '../types'

export function visitMessage(message: Message | MessageLegacy) {
  const messageFile = message.version === 1 ? message.filePath : message.location.file
  const messageRange = message.version === 1 ? message.range : message.location.position
  atom.workspace.open(messageFile, { searchAllPanes: true }).then(function() {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor && textEditor.getPath() === messageFile) {
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
  return element.textContent.replace(/\u00A0/gu, ' ')
}
