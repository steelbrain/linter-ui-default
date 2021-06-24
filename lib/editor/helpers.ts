import type { Point, TextEditor, TextEditorElement, PointLike } from 'atom'
import type Tooltip from '../tooltip/index'

const TOOLTIP_WIDTH_HIDE_OFFSET = 30

export function getBufferPositionFromMouseEvent(
  event: MouseEvent,
  editor: TextEditor,
  editorElement: TextEditorElement,
): Point | null {
  const editorComponent = editorElement.getComponent()
  const pixelPosition = editorComponent.pixelPositionForMouseEvent(event)
  const screenPosition = editorComponent.screenPositionForPixelPosition(pixelPosition)
  if (Number.isNaN(screenPosition.row) || Number.isNaN(screenPosition.column)) {
    return null
  }
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
  tooltipElement: Tooltip['element']
  screenPosition: PointLike
}): boolean {
  const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event)
  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition)
  const differenceTop = pixelPosition.top - expectedPixelPosition.top
  const differenceLeft = pixelPosition.left - expectedPixelPosition.left

  const editorLineHeight = editor.getLineHeightInPixels()
  const elementHeight = tooltipElement.offsetHeight + editorLineHeight
  const elementWidth = tooltipElement.offsetWidth

  if (
    /* Cursor is below the line*/ (differenceTop > 0 && differenceTop > elementHeight + 1.5 * editorLineHeight) ||
    /* Cursor is above the line */ (differenceTop < 0 && differenceTop < -1.5 * editorLineHeight) ||
    /* Right of the start of highlight */ (differenceLeft > 0 &&
      differenceLeft > elementWidth + TOOLTIP_WIDTH_HIDE_OFFSET) ||
    /* Left of start of highlight */ (differenceTop < 0 && differenceLeft < -1 * TOOLTIP_WIDTH_HIDE_OFFSET)
  ) {
    return false
  }
  return true
}

export function hasParent(givenElement: HTMLElement | null, selector: string): boolean {
  let element: HTMLElement | null = givenElement
  if (element === null) {
    return false
  }
  do {
    if (element.matches(selector)) {
      return true
    }
    element = element.parentElement
  } while (element !== null && element.nodeName !== 'HTML')
  return false
}
