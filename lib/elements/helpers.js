'use babel'

/* @flow */

import type { Message } from '../types'

export function visitMessage(message: Message) {
  atom.workspace.open(message.location.file, { searchAllPanes: true }).then(function() {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor && textEditor.getPath() === message.location.file) {
      textEditor.setCursorBufferPosition(message.location.position.start)
    }
  })
}
