'use babel'

import {Range} from 'atom'

export function getEditorsMap(editorUI) {
  const editors = {}
  const diff = {}
  const activePaths = new Set()
  editorUI.forEach(function(ui) {
    const path = ui.editor.getPath()
    if (path) {
      if (typeof editors[path] === 'undefined') {
        editors[path] = [ui]
        diff[path] = {added: [], removed: []}
        activePaths.add(path)
      } else {
        editors[path].push(ui)
      }
    }
  })
  return {editors, diff, activePaths}
}

export function getMessageRange(message) {
  return message.range ? (
    message.range.constructor.name === 'Array' ? Range.fromObject(message.range) : message.range
  ) : null
}

export function getMessageClass(message) {
  return message.class + ' ' + message.type.toLowerCase()
}
