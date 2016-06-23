'use babel'

/* @flow */

import { Range, Point } from 'atom'
import type Editors from './editors'
import type { Message, MessageLegacy } from './types'
import type { TextEditor } from 'atom'

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

export function getMessagesOnPoint(messages: Set<Message | MessageLegacy>, filePath: string, cursorPosition: Point): Array<Message | MessageLegacy> {
  const filtered = []
  const range = new Range(cursorPosition, cursorPosition)
  for (const message of messages) {
    if (message.version === 1 && message.filePath === filePath && range.intersectsWith(message.range)) {
      filtered.push(message)
    } else if (message.version === 2 && message.location.file === filePath && range.intersectsWith(message.location.position)) {
      filtered.push(message)
    }
  }
  return filtered
}

export function sortMessages(messages: Array<Message | MessageLegacy>): Array<Message | MessageLegacy> {
  return messages.sort(function(a, b) {
    const locationA = a.version === 1 ? a.filePath : a.location.file
    const locationB = b.version === 1 ? b.filePath : b.location.file
    const lengthA = locationA && locationA.length || 0
    const lengthB = locationB && locationB.length || 0

    if (lengthA > lengthB) {
      return 1
    } else if (lengthA < lengthB) {
      return -1
    }

    const positionA = a.version === 1 ? a.range : a.location.position
    const positionB = b.version === 1 ? b.range : b.location.position

    if (positionA && !positionB) {
      // Show those without a position above others
      return -1
    } else if (positionB && !positionA) {
      return -1
    }

    return positionA.compare(positionB)
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

export function projectPathByFile(projectPaths: Array<string>, filePath: string): ?string {
  if (projectPaths.length < 3) {
    if (filePath.indexOf(projectPaths[0]) === 0) {
      return projectPaths[0]
    }
    if (filePath.indexOf(projectPaths[1]) === 0) {
      return projectPaths[1]
    }
    if (filePath.indexOf(projectPaths[2]) === 0) {
      return projectPaths[2]
    }
    return null
  }
  for (let i = 0, length = projectPaths.length, projectPath; i < length; ++i) {
    projectPath = projectPaths[i]
    if (filePath.indexOf(projectPath) === 0) {
      return projectPath
    }
  }
  return null
}
