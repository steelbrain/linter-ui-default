/* @flow */

import { Range } from 'atom'
import { shell } from 'electron'
import type { Point, TextEditor } from 'atom'
import type Editors from './editors'
import type { LinterMessage } from './types'

let lastPaneItem = null
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
export const WORKSPACE_URI = 'atom://linter-ui-default'

export function $range(message: LinterMessage): ?Object {
  return message.version === 1 ? message.range : message.location.position
}
export function $file(message: LinterMessage): ?string {
  return message.version === 1 ? message.filePath : message.location.file
}
export function copySelection() {
  const selection = getSelection()
  if (selection) {
    atom.clipboard.write(selection.toString())
  }
}
export function getPathOfMessage(message: LinterMessage): string {
  return atom.project.relativizePath($file(message) || '')[1]
}
export function getActiveTextEditor(): ?TextEditor {
  let paneItem = atom.workspace.getCenter().getActivePaneItem()
  const paneIsTextEditor = atom.workspace.isTextEditor(paneItem)
  if (
    !paneIsTextEditor &&
    paneItem &&
    lastPaneItem &&
    paneItem.getURI &&
    paneItem.getURI() === WORKSPACE_URI &&
    (!lastPaneItem.isAlive || lastPaneItem.isAlive())
  ) {
    paneItem = lastPaneItem
  } else {
    lastPaneItem = paneItem
  }
  return atom.workspace.isTextEditor(paneItem) ? paneItem : null
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

export function filterMessages(
  messages: Array<LinterMessage>,
  filePath: ?string,
  severity: ?string = null,
): Array<LinterMessage> {
  const filtered = []
  messages.forEach(function(message) {
    if ((filePath === null || $file(message) === filePath) && (!severity || message.severity === severity)) {
      filtered.push(message)
    }
  })
  return filtered
}

export function filterMessagesByRangeOrPoint(
  messages: Set<LinterMessage> | Array<LinterMessage>,
  filePath: string,
  rangeOrPoint: Point | Range,
): Array<LinterMessage> {
  const filtered = []
  const expectedRange =
    rangeOrPoint.constructor.name === 'Point' ? new Range(rangeOrPoint, rangeOrPoint) : Range.fromObject(rangeOrPoint)
  messages.forEach(function(message) {
    const file = $file(message)
    const range = $range(message)
    if (file && range && file === filePath && range.intersectsWith(expectedRange)) {
      filtered.push(message)
    }
  })
  return filtered
}

export function openFile(file: string, position: ?Point) {
  const options = {}
  options.searchAllPanes = true
  if (position) {
    options.initialLine = position.row
    options.initialColumn = position.column
  }
  atom.workspace.open(file, options)
}

export function visitMessage(message: LinterMessage, reference: boolean = false) {
  let messageFile
  let messagePosition
  if (reference) {
    if (message.version !== 2) {
      console.warn('[Linter-UI-Default] Only messages v2 are allowed in jump to reference. Ignoring')
      return
    }
    if (!message.reference || !message.reference.file) {
      console.warn('[Linter-UI-Default] Message does not have a valid reference. Ignoring')
      return
    }
    messageFile = message.reference.file
    messagePosition = message.reference.position
  } else {
    const messageRange = $range(message)
    messageFile = $file(message)
    if (messageRange) {
      messagePosition = messageRange.start
    }
  }
  if (messageFile) {
    openFile(messageFile, messagePosition)
  }
}

export function openExternally(message: LinterMessage): void {
  if (message.version === 2 && message.url) {
    shell.openExternal(message.url)
  }
}

export function sortMessages(
  sortInfo: Array<{ column: string, type: 'asc' | 'desc' }>,
  rows: Array<LinterMessage>,
): Array<LinterMessage> {
  const sortColumns: {
    severity?: 'asc' | 'desc',
    linterName?: 'asc' | 'desc',
    file?: 'asc' | 'desc',
    line?: 'asc' | 'desc',
  } = {}

  sortInfo.forEach(function(entry) {
    sortColumns[entry.column] = entry.type
  })

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
      const fileA = getPathOfMessage(a)
      const fileALength = fileA.length
      const fileB = getPathOfMessage(b)
      const fileBLength = fileB.length
      if (fileALength !== fileBLength) {
        return multiplyWith * (fileALength > fileBLength ? 1 : -1)
      } else if (fileA !== fileB) {
        return multiplyWith * fileA.localeCompare(fileB)
      }
    }
    if (sortColumns.line) {
      const multiplyWith = sortColumns.line === 'asc' ? 1 : -1
      const rangeA = $range(a)
      const rangeB = $range(b)
      if (rangeA && !rangeB) {
        return 1
      } else if (rangeB && !rangeA) {
        return -1
      } else if (rangeA && rangeB) {
        if (rangeA.start.row !== rangeB.start.row) {
          return multiplyWith * (rangeA.start.row > rangeB.start.row ? 1 : -1)
        }
        if (rangeA.start.column !== rangeB.start.column) {
          return multiplyWith * (rangeA.start.column > rangeB.start.column ? 1 : -1)
        }
      }
    }

    return 0
  })
}

export function sortSolutions(solutions: Array<Object>): Array<Object> {
  return solutions.slice().sort(function(a, b) {
    return b.priority - a.priority
  })
}

export function applySolution(textEditor: TextEditor, version: 1 | 2, solution: Object): boolean {
  if (solution.apply) {
    solution.apply()
    return true
  }
  const range = version === 1 ? solution.range : solution.position
  const currentText = version === 1 ? solution.oldText : solution.currentText
  const replaceWith = version === 1 ? solution.newText : solution.replaceWith
  if (currentText) {
    const textInRange = textEditor.getTextInBufferRange(range)
    if (currentText !== textInRange) {
      console.warn(
        '[linter-ui-default] Not applying fix because text did not match the expected one',
        'expected',
        currentText,
        'but got',
        textInRange,
      )
      return false
    }
  }
  textEditor.setTextInBufferRange(range, replaceWith)
  return true
}
