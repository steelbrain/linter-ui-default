/* @flow */

import { Range, Point } from 'atom'
import type { TextEditor } from 'atom'
import type { LinterMessage } from '../types'

export function getBufferPositionFromMouseEvent(event: MouseEvent, editor: TextEditor, editorElement: Object): ?Point {
  const pixelPosition = editorElement.component.pixelPositionForMouseEvent(event)
  const screenPosition = editorElement.component.screenPositionForPixelPosition(pixelPosition)
  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition)
  const differenceTop = pixelPosition.top - expectedPixelPosition.top
  const differenceLeft = pixelPosition.left - expectedPixelPosition.left
  // Only allow offset of 20px - Fixes steelbrain/linter-ui-default#63
  if (
    (differenceTop === 0 || (differenceTop > 0 && differenceTop < 20) || (differenceTop < 0 && differenceTop > -20)) &&
    (differenceLeft === 0 || (differenceLeft > 0 && differenceLeft < 20) || (differenceLeft < 0 && differenceLeft > -20))
  ) {
    return editor.bufferPositionForScreenPosition(screenPosition)
  }
  return null
}

export function mouseEventNearPosition(event: MouseEvent, editorElement: Object, screenPosition: Point, elementWidth: number, elementHeight: number): boolean {
  const pixelPosition = editorElement.component.pixelPositionForMouseEvent(event)
  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition)
  const differenceTop = pixelPosition.top - expectedPixelPosition.top
  const differenceLeft = pixelPosition.left - expectedPixelPosition.left
  if (differenceTop === 0 && differenceLeft === 0) {
    return true
  }
  if ((differenceTop > 0 && differenceTop > (elementHeight + 20)) || (differenceTop < 0 && differenceTop < -5)) {
    return false
  }
  if (differenceLeft > 15 && differenceTop < 17) {
    return false
  }
  return (differenceLeft > 0 && differenceLeft < (elementWidth + 20)) || (differenceLeft < 0 && differenceLeft > -5)
}

export function getMessagesOnPoint(messages: Set<LinterMessage>, filePath: string, cursorPosition: Point): Array<LinterMessage> {
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

export function pointInMessageRange(point: Point, message: LinterMessage): boolean {
  const range = message.version === 1 ? message.range : message.location.position
  return !!(range && range.containsPoint(point))
}
