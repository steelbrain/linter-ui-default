/* @flow */

import invariant from 'assert'
import { Range } from 'atom'
import type { Point } from 'atom'
import type Editors from './editors'
import type { LinterMessage } from './types'

export const $file = '__sb_linter_ui_default$file'
export const $range = '__sb_linter_ui_default$range'

export function normalizeMessages(messages: Array<LinterMessage>) {
  for (let i = 0, length = messages.length; i < length; ++i) {
    const message = messages[i]
    if (typeof message[$file] === 'undefined') {
      message[$file] = message.version === 1 ? message.filePath : message.location.file
    }
    if (typeof message[$range] === 'undefined') {
      message[$range] = message.version === 1 ? message.range : message.location.position
    }
  }
}

export function getEditorsMap(editors: Editors): { editorsMap: Object, filePaths: Array<string> } {
  const editorsMap = {}
  const filePaths = []
  for (const entry of editors.editors) {
    const filePath = entry.textEditor.getPath()
    if (editorsMap[filePath]) {
      editorsMap[filePath].editors.push(entry)
    } else {
      editorsMap[filePath] = {
        added: [],
        removed: [],
        editors: [entry],
      }
      filePaths.push(filePath)
    }
  }
  return { editorsMap, filePaths }
}

export function getMessagesOnRangeOrPoint(messages: Set<LinterMessage> | Array<LinterMessage>, filePath: string, rangeOrPoint: Point | Range): Array<LinterMessage> {
  const filtered = []
  const range = rangeOrPoint.constructor.name === 'Point' ? new Range(rangeOrPoint, rangeOrPoint) : rangeOrPoint
  for (const message of messages) {
    if (message[$file] && message[$range] && message[$file] === filePath && range.intersectsWith(message[$range])) {
      filtered.push(message)
    }
  }
  return filtered
}

export function sortMessages(messages: Array<LinterMessage>): Array<LinterMessage> {
  return messages.sort(function(a, b) {
    const locationA = a.version === 1 ? a.filePath : a.location.file
    const locationB = b.version === 1 ? b.filePath : b.location.file
    const lengthA = locationA && locationA.length ? locationA.length : 0
    const lengthB = locationB && locationB.length ? locationB.length : 0

    if (lengthA > lengthB) {
      return 1
    } else if (lengthA < lengthB) {
      return -1
    }

    const positionA = a.version === 1 ? a.range : a.location.position
    const positionB = b.version === 1 ? b.range : b.location.position

    if (positionA && !positionB) {
      // Show those without a position above others
      return -1
    } else if (positionB && !positionA) {
      return -1
    }
    invariant(positionA && positionB)

    return positionA.compare(positionB)
  })
}

export function visitMessage(message: LinterMessage) {
  const messageFile = message[$file]
  const messageRange = message[$range]
  atom.workspace.open(messageFile, { searchAllPanes: true }).then(function() {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (textEditor && textEditor.getPath() === messageFile && messageRange) {
      textEditor.setCursorBufferPosition(messageRange.start)
    }
  })
}

export function copySelection() {
  const selection = getSelection()
  if (selection) {
    atom.clipboard.write(selection.toString())
  }
}
