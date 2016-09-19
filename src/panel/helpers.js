/* @flow */

import type { LinterMessage } from '../types'

export function getFileOfMessage(message: LinterMessage): string {
  return atom.project.relativizePath(message.version === 1 ? (message.filePath || '') : message.location.file)[1]
}

export function getLineOfMessage(message: LinterMessage): number {
  if (message.version === 1) {
    return message.range ? message.range.start.row : 0
  }
  return message.location.position.start.row
}
