'use babel'

/* @flow */

import {Range, Point} from 'atom'
import type Buffers from './buffers'
import type {Buffer$Difference, Linter$Message} from './types'

export function getBuffersMap(buffers: Buffers): Object {
  const buffersMap = {}
  for (const buffer of buffers.getBuffers()) {
    const filePath = buffer.getBuffer().getPath()
    buffersMap[filePath] = {
      buffer: buffer,
      added: [],
      removed: []
    }
  }
  return buffersMap
}

export function getMessageClass(message: Linter$Message): string {
  return (message.class || '') + ' ' + message.type.toLowerCase()
}

export function getMessagesOnPoint(messages: Set<Linter$Message>, filePath: string, cursorPosition: Point): Set<Linter$Message> {
  const filtered = new Set()
  const range = new Range(cursorPosition, cursorPosition)
  for (const message of messages) {
    if (message.filePath === filePath && message.range && range.intersectsWith(Range.fromObject(message.range))) {
      filtered.add(message)
    }
  }
  return filtered
}
