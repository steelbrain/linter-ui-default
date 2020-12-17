import type { Point, TextEditor, TextEditorElement, PointLike } from 'atom'
import type TooltipElement from '../tooltip/index'

const TOOLTIP_WIDTH_HIDE_OFFSET = 30

export function getBufferPositionFromMouseEvent(
  event: MouseEvent,
  editor: TextEditor,
  editorElement: TextEditorElement,
): Point | null {
  const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event)
  const screenPosition = editorElement.getComponent().screenPositionForPixelPosition(pixelPosition)
  if (Number.isNaN(screenPosition.row) || Number.isNaN(screenPosition.column)) return null
  // ^ Workaround for NaN bug steelbrain/linter-ui-default#191
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

export function mouseEventNearPosition({
  event,
  editor,
  editorElement,
  tooltipElement,
  screenPosition,
}: {
  event: { clientX: number; clientY: number }
  editor: TextEditor
  editorElement: TextEditorElement
  tooltipElement: TooltipElement['element']
  screenPosition: PointLike
}): boolean {
  const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event)
  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition)
  const differenceTop = pixelPosition.top - expectedPixelPosition.top
  const differenceLeft = pixelPosition.left - expectedPixelPosition.left

  const editorLineHeight = editor.getLineHeightInPixels()
  const elementHeight = tooltipElement.offsetHeight + editorLineHeight
  const elementWidth = tooltipElement.offsetWidth

  if (differenceTop > 0) {
    // Cursor is below the line
    if (differenceTop > elementHeight + 1.5 * editorLineHeight) {
      return false
    }
  } else if (differenceTop < 0) {
    // Cursor is above the line
    if (differenceTop < -1.5 * editorLineHeight) {
      return false
    }
  }
  if (differenceLeft > 0) {
    // Right of the start of highlight
    if (differenceLeft > elementWidth + TOOLTIP_WIDTH_HIDE_OFFSET) {
      return false
    }
  } else if (differenceLeft < 0) {
    // Left of start of highlight
    if (differenceLeft < -1 * TOOLTIP_WIDTH_HIDE_OFFSET) {
      return false
    }
  }
  return true
}

export function hasParent(givenElement: HTMLElement, selector: string): boolean {
  let element: HTMLElement | null = givenElement
  do {
    if (element.matches(selector)) {
      return true
    }
    element = element.parentElement
  } while (element && element.nodeName !== 'HTML')
  return false
}
