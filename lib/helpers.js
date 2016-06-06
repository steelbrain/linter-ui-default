'use babel'

/* @flow */

import { Range, Point } from 'atom'
import type Editors from './editors'
import type { Message } from './types'
import type { TextEditor } from 'atom'

export function visitMessage(message: Message): Promise {
  return atom.workspace.open(message.location.file).then(function() {
    atom.workspace.getActiveTextEditor().setCursorBufferPosition(message.location.position.start)
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

export function getMessagesOnPoint(messages: Set<Linter$Message>, filePath: string, cursorPosition: Point): Set<Linter$Message> {
  const filtered = new Set()
  const range = new Range(cursorPosition, cursorPosition)
  for (const message of messages) {
    if (message.location.file === filePath && range.intersectsWith(message.location.position)) {
      filtered.add(message)
    }
  }
  return filtered
}

export function sortMessages(messages: Array<Linter$Message>): Array<Linter$Message> {
  return messages.sort(function(a, b) {
    const lengthA = a.location.file && a.location.file.length || 0
    const lengthB = b.location.file && b.location.file.length || 0

    if (lengthA > lengthB) {
      return 1
    } else if (lengthA < lengthB) {
      return -1
    }
    return a.location.position.compare(b.location.position)
  })
}

export function copySelection() {
  const selection = getSelection()
  if (selection) {
    atom.clipboard.write(selection.toString())
  }
}

export function getBufferPositionFromMouseEvent(event: MouseEvent, editor: TextEditor, editorElement: HTMLElement): ?Point {
  const pixelPosition = editorElement.component.pixelPositionForMouseEvent(event)
  const screenPosition = editorElement.component.screenPositionForPixelPosition(pixelPosition)
  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition)
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
