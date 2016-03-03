'use babel'

/* @flow */

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
