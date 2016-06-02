'use babel'

/* @flow */

import { Range, Point } from 'atom'
import type Editors from './editors'
import type { Linter$Message } from './types'
import type { TextEditor } from 'atom'

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

export function getEditorsMap(editors: Editors): { editorsMap: Object, filePaths: Set<string> } {
  const editorsMap = {}
  const filePaths = new Set()
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
      filePaths.add(filePath)
    }
  }
  return { editorsMap, filePaths }
}

export function getMessageRange(message: Linter$Message): Range {
  return Array.isArray(message.range) ? Range.fromObject(message.range) : message.range
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
  const selection = getSelection()
  if (selection) {
    atom.clipboard.write(selection.toString())
  }
}

export function htmlToText(html: any) {
  const element = document.createElement('div')
  if (typeof html === 'string') {
    element.innerHTML = html
  } else {
    element.appendChild(html.cloneNode(true))
  }
  /* eslint-disable no-irregular-whitespace */
  // NOTE: Convert &nbsp; to regular whitespace
  return element.textContent.replace(/ /g, ' ')
  /* eslint-enable no-irregular-whitespace */
}

export function getBufferPositionFromMouseEvent(event: MouseEvent, editor: TextEditor, editorElement: HTMLElement): ?Point {
  const pixelPosition = editorElement.component.pixelPositionForMouseEvent(event)
  const screenPosition = editorElement.component.screenPositionForPixelPosition(pixelPosition)
  const expectedPixelPosition = editor.pixelPositionForScreenPosition(screenPosition)
  const differenceTop = pixelPosition.top - expectedPixelPosition.top
  const differentLeft = pixelPosition.left - expectedPixelPosition.left
  // Only allow offset of 20px - Fixes steelbrain/linter-ui-default#63
  if (
    (differenceTop === 0 || (differenceTop > 0 && differenceTop < 20) || (differenceTop < 0 && differenceTop > -20)) &&
    (differentLeft === 0 || (differentLeft > 0 && differentLeft < 20) || (differentLeft < 0 && differentLeft > -20))
  ) {
    return editor.bufferPositionForScreenPosition(screenPosition)
  }
  return null
}
