'use babel'

/* @flow */

import type { Message } from '../types'

export function visitMessage(message: Message) {
  const messageFile = message.version === 1 ? message.filePath : message.location.file
  const messageRange = message.version === 1 ? message.range : message.location.position
  atom.workspace.open(messageFile, { searchAllPanes: true }).then(function() {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor && textEditor.getPath() === message.location.file) {
      textEditor.setCursorBufferPosition(messageRange.start)
    }
  })
}
