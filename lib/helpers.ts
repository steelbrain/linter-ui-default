import { Range } from 'atom'
import type { Point, PointLike, RangeCompatible, TextEditor, WorkspaceOpenOptions } from 'atom'
import { shell } from 'electron'
import type Editors from './editors'
import type { LinterMessage, MessageSolution, EditorsMap, TextEditorExtra } from './types'

let lastPaneItem: TextEditorExtra | null = null
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
export const DOCK_ALLOWED_LOCATIONS = ['center', 'bottom']
export const DOCK_DEFAULT_LOCATION = 'bottom'

export function $range(message: LinterMessage): Range | null | undefined {
  return message.location.position
}
export function $file(message: LinterMessage): string | null | undefined {
  return message.location.file
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
export function getActiveTextEditor(): TextEditor | null {
  let paneItem = atom.workspace.getCenter().getActivePaneItem() as TextEditorExtra | null
  const paneIsTextEditor = paneItem !== null ? atom.workspace.isTextEditor(paneItem) : false
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
  return paneIsTextEditor ? paneItem : null
}

export function getEditorsMap(editors: Editors): { editorsMap: EditorsMap; filePaths: Array<string> } {
  // TODO types
  const editorsMap: EditorsMap = new Map()
  const filePaths: string[] = []
  for (const entry of editors.editors) {
    const filePath = entry.textEditor.getPath() ?? '' // if undefined save it as ""
    if (editorsMap.has(filePath)) {
      editorsMap.get(filePath)!.editors.push(entry)
    } else {
      editorsMap.set(filePath, {
        added: [],
        removed: [],
        editors: [entry],
      })
      filePaths.push(filePath)
    }
  }
  return { editorsMap, filePaths }
}

export function filterMessages(
  messages: Array<LinterMessage>,
  filePath: string | null | undefined,
  severity: string | null | undefined = null,
): Array<LinterMessage> {
  const filtered: Array<LinterMessage> = []
  messages.forEach(function (message) {
    if (!message || !message.location) {
      return
    }
    if ((filePath === null || $file(message) === filePath) && (!severity || message.severity === severity)) {
      filtered.push(message)
    }
  })
  return filtered
}

export function filterMessagesByRangeOrPoint(
  messages: Set<LinterMessage> | Array<LinterMessage> | Map<string, LinterMessage>,
  filePath: string | undefined,
  rangeOrPoint: Point | RangeCompatible,
): Array<LinterMessage> {
  const filtered: Array<LinterMessage> = []
  const expectedRange =
    rangeOrPoint.constructor.name === 'Point'
      ? new Range(rangeOrPoint as Point, rangeOrPoint as Point)
      : Range.fromObject(rangeOrPoint as RangeCompatible)
  messages.forEach(function (message: LinterMessage) {
    const file = $file(message)
    const range = $range(message)
    if (
      file &&
      range &&
      file === filePath &&
      typeof range.intersectsWith === 'function' &&
      range.intersectsWith(expectedRange)
    ) {
      filtered.push(message)
    }
  })
  return filtered
}

export function openFile(file: string, position: PointLike | null | undefined) {
  const options: WorkspaceOpenOptions = { searchAllPanes: true }
  if (position) {
    options.initialLine = position.row
    options.initialColumn = position.column
  }
  atom.workspace.open(file, options)
}

export function visitMessage(message: LinterMessage, reference = false) {
  let messageFile: string | undefined | null
  let messagePosition: Point | undefined
  if (reference) {
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

export function openExternally(message: LinterMessage) {
  if (message.version === 2 && message.url) {
    shell.openExternal(message.url)
  }
}

export function sortMessages(
  rows: Array<LinterMessage>,
  sortDirection: [id: 'severity' | 'linterName' | 'file' | 'line', direction: 'asc' | 'desc'],
): Array<LinterMessage> {
  const sortDirectionID = sortDirection[0]
  const sortDirectionDirection = sortDirection[1]
  const multiplyWith = sortDirectionDirection === 'asc' ? 1 : -1

  return rows.sort(function (a, b) {
    if (sortDirectionID === 'severity') {
      const severityA = severityScore[a.severity]
      const severityB = severityScore[b.severity]
      if (severityA !== severityB) {
        return multiplyWith * (severityA > severityB ? 1 : -1)
      }
    }
    if (sortDirectionID === 'linterName') {
      const sortValue = a.severity.localeCompare(b.severity)
      if (sortValue !== 0) {
        return multiplyWith * sortValue
      }
    }
    if (sortDirectionID === 'file') {
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
    if (sortDirectionID === 'line') {
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

export function sortSolutions(solutions: MessageSolution[]) {
  return solutions.sort(function (a, b) {
    if (a.priority === undefined || b.priority === undefined) {
      return 0
    }
    return b.priority - a.priority
  })
}

export function applySolution(textEditor: TextEditor, solution: MessageSolution): boolean {
  if ('apply' in solution) {
    solution.apply()
    return true
  }
  const range = solution.position
  const replaceWith = solution.replaceWith
  if ('currentText' in solution) {
    const currentText = solution.currentText
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

const largeFileLineCount = atom.config.get('linter-ui-default.largeFileLineCount')
const longLineLength = atom.config.get('linter-ui-default.longLineLength')

export function isLargeFile(editor: TextEditor) {
  const lineCount = editor.getLineCount()
  // @ts-ignore
  if (editor.largeFileMode || lineCount >= largeFileLineCount) {
    return true
  }
  const buffer = editor.getBuffer()
  for (let i = 0, len = lineCount; i < len; i++) {
    if (buffer.lineLengthForRow(i) > longLineLength) {
      return true
    }
  }
  return false
}
