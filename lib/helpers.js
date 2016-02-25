'use babel'

/* @flow */

import type {Editors} from './editors'
import type {Buffer$Difference, Linter$Message} from './types'

export function getEditorsMap(editors: Editors): Object {
  const editorMap = {}
  const filePaths = []
  for (const buffer of editors.buffers) {
    const filePath = buffer.textBuffer.getPath()
    const entry: Buffer$Difference = {
      textBuffer: buffer.textBuffer,
      markers: buffer.markers,
      added: [],
      removed: []
    }
    editorMap[filePath] = entry
    filePaths.push(filePath)
  }
  return {editorMap, filePaths}
}

export function getMessageClass(message: Linter$Message): string {
  return (message.class || '') + ' ' + message.type.toLowerCase()
}
