/* @flow */

import type { Point, TextEditor } from 'atom'

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

export function hasParent(element: HTMLElement, selector: string): boolean {
  do {
    if (element.matches(selector)) {
      return true
    }
    // $FlowIgnore: It's parent is an HTMLElement, not a NODE!
    element = element.parentNode
  } while (element && element.nodeName !== 'HTML')
  return false
}
