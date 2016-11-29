/* @flow */

import { Range } from 'atom'
import type { Point } from 'atom'
import type Editors from './editors'
import type { LinterMessage } from './types'

export const $file = '__sb_linter_ui_default$file'
export const $range = '__sb_linter_ui_default$range'

export const severityScore = {
  error: 3,
  warning: 2,
  info: 1,
}

export const severityNames = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

export function normalizeMessages(messages: Array<Object>) {
  for (let i = 0, length = messages.length; i < length; ++i) {
    const message = messages[i]
    if (typeof message[$file] === 'undefined') {
      message[$file] = message.version === 1 ? message.filePath : message.location.file
    }
    if (typeof message[$range] === 'undefined') {
      message[$range] = message.version === 1 ? message.range : message.location.position
    }
    if (message.version === 1 && message.trace) {
      normalizeMessages(message.trace)
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

export function visitMessage(message: LinterMessage) {
  const messageFile = message[$file]
  const messageRange = message[$range]
  atom.workspace.open(messageFile, { searchAllPanes: true }).then(function() {
    const textEditor = atom.workspace.getActiveTextEditor()
    if (messageRange && textEditor && textEditor.getPath() === messageFile) {
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

export function getFileOfMessage(message: LinterMessage): string {
  return atom.project.relativizePath(message[$file] || '')[1]
}

export function sortMessages(sortInfo: Array<{ column: string, type: 'asc' | 'desc' }>, rows: Array<LinterMessage>): Array<LinterMessage> {
  const sortColumns : {
    severity?: 'asc' | 'desc',
    linterName?: 'asc' | 'desc',
    file?: 'asc' | 'desc',
    line?: 'asc' | 'desc'
  } = {}

  for (let i = 0, length = sortInfo.length; i < length; i++) {
    const entry = sortInfo[i]
    sortColumns[entry.column] = entry.type
  }

  return rows.slice().sort(function(a, b) {
    if (sortColumns.severity) {
      const multiplyWith = sortColumns.severity === 'asc' ? 1 : -1
      const severityA = severityScore[a.severity]
      const severityB = severityScore[b.severity]
      if (severityA !== severityB) {
        return multiplyWith * (severityA > severityB ? 1 : -1)
      }
    }
    if (sortColumns.linterName) {
      const multiplyWith = sortColumns.linterName === 'asc' ? 1 : -1
      const sortValue = a.severity.localeCompare(b.severity)
      if (sortValue !== 0) {
        return multiplyWith * sortValue
      }
    }
    if (sortColumns.file) {
      const multiplyWith = sortColumns.file === 'asc' ? 1 : -1
      const fileA = getFileOfMessage(a)
      const fileALength = fileA.length
      const fileB = getFileOfMessage(b)
      const fileBLength = fileB.length
      if (fileALength !== fileBLength) {
        return multiplyWith * (fileALength > fileBLength ? 1 : -1)
      } else if (fileA !== fileB) {
        return multiplyWith * fileA.localeCompare(fileB)
      }
    }
    if (sortColumns.line) {
      const multiplyWith = sortColumns.line === 'asc' ? 1 : -1
      const rangeA = a[$range]
      const rangeB = b[$range]
      if (rangeA && !rangeB) {
        return 1
      } else if (rangeB && !rangeA) {
        return -1
      } else if (rangeA && rangeB) {
        if (rangeA.start.line !== rangeB.start.line) {
          return multiplyWith * (rangeA.start.line > rangeB.start.line ? 1 : -1)
        }
        if (rangeA.start.column !== rangeB.start.column) {
          return multiplyWith * (rangeA.start.column > rangeB.start.column ? 1 : -1)
        }
      }
    }

    return 0
  })
}
