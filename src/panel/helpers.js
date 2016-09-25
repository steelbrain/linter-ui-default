/* @flow */

import type { LinterMessage } from '../types'

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

export function getFileOfMessage(message: LinterMessage): string {
  return atom.project.relativizePath(message.version === 1 ? (message.filePath || '') : message.location.file)[1]
}

export function getLineOfMessage(message: LinterMessage): number {
  if (message.version === 1) {
    return message.range ? message.range.start.row : 0
  }
  return message.location.position.start.row
}

export function sortRows(sortInfo: Array<{ column: string, type: 'asc' | 'desc' }>, rows: Array<LinterMessage>): Array<LinterMessage> {
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
      const lineA = getLineOfMessage(a)
      const lineB = getLineOfMessage(b)
      if (lineA !== lineB) {
        return multiplyWith * (lineA > lineB ? 1 : -1)
      }
    }

    return 0
  })
}
