'use babel'

/* @flow */

import { Range, Point } from 'atom'
import type Buffers from './buffers'
import type { Linter$Message } from './types'

let clipboard

try {
  clipboard = require('electron').clipboard
} catch (_) {
  clipboard = require('clipboard')
}

export function map<TValue, TResult>(iterable: Array<TValue> | Set<TValue>, callback: ((param: TValue) => TResult)): Array<TResult> {
  const toReturn = []
  for (const entry of iterable) {
    toReturn.push(callback(entry))
  }
  return toReturn
}

export function visitMessage(message: Linter$Message): Promise {
  return atom.workspace.open(message.filePath).then(function() {
    if (message.range) {
      const textEditor = atom.workspace.getActiveTextEditor()
      // $FlowIgnore: Flow doesn't believe me
      textEditor.setCursorBufferPosition(message.range[0] || message.range.start)
    }
    if (typeof message.selected === 'function') {
      message.selected(message)
    }
  })
}

export function getBuffersMap(buffers: Buffers): { buffersMap: Object, filePaths: Set<string> } {
  const buffersMap = {}
  const filePaths = new Set()
  for (const buffer of buffers.getBuffers()) {
    const filePath = buffer.getBuffer().getPath()
    buffersMap[filePath] = {
      buffer,
      added: [],
      removed: []
    }
    filePaths.add(filePath)
  }
  return { buffersMap, filePaths }
}

export function getMessageRange(message: Linter$Message): Range {
  return Array.isArray(message.range) ? Range.fromObject(message.range) : message.range
}
export function getMessageClass(message: Linter$Message): string {
  return `${message.class || ''} ${message.type.toLowerCase()}`
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

export function sortMessages(messages: Array<Linter$Message>): Array<Linter$Message> {
  return messages.sort(function(a, b) {
    const lengthA = a.filePath && a.filePath.length || 0
    const lengthB = b.filePath && b.filePath.length || 0

    if (lengthA > lengthB) {
      return 1
    } else if (lengthA < lengthB) {
      return -1
    }
    if (a.range) {
      if (b.range) {
        return getMessageRange(a).compare(b.range)
      }
      return 1
    }
    if (b.range) {
      return -1
    }
    return 0
  })
}

export function copySelection() {
  const selection = getSelection().toString()
  clipboard.writeText(selection)
}
