'use babel'

/* @flow */

import {Range} from 'atom'
import type Buffers from './buffers'
import type {Buffer$Difference, Linter$Message} from './types'
import type {Point} from 'atom'

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

export function getLineMessages(messages: Array<Linter$Message>, filePath: string, cursorPosition: Point): Array<Linter$Message> {
  const filtered = []
  const range = Range.fromObject([cursorPosition, cursorPosition])
  for (const message of messages) {
    if (message.filePath === filePath && message.range && range.intersectsWith(message.range)) {
      filtered.push(message)
    }
  }
  return filtered
}
