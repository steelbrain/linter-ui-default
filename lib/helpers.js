'use babel'

/* @flow */

import type {Editors} from './editors'

export function getEditorsMap(editors: Editors): Object {
  const editorMap = {}
  const filePaths = []
  for (const buffer of editors.buffers) {
    const filePath = buffer.textBuffer.getPath()
    const entry = {
      textBuffer: buffer.textBuffer,
      markers: buffer.markers,
      editors: [],
      added: [],
      removed: []
    }
    for (const editor of editors.textEditors.values()) {
      if (editor.getPath() === filePath) {
        entry.editors.push(editor)
      }
    }
    editorMap[filePath] = entry
    filePaths.push(filePath)
  }
  return {editorMap, filePaths}
}
