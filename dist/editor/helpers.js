"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasParent = exports.mouseEventNearPosition = exports.getBufferPositionFromMouseEvent = void 0;
const TOOLTIP_WIDTH_HIDE_OFFSET = 30;
function getBufferPositionFromMouseEvent(event, editor, editorElement) {
    const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event);
    const screenPosition = editorElement.getComponent().screenPositionForPixelPosition(pixelPosition);
    if (Number.isNaN(screenPosition.row) || Number.isNaN(screenPosition.column))
        return null;
    const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition);
    const differenceTop = pixelPosition.top - expectedPixelPosition.top;
    const differenceLeft = pixelPosition.left - expectedPixelPosition.left;
    if ((differenceTop === 0 || (differenceTop > 0 && differenceTop < 20) || (differenceTop < 0 && differenceTop > -20)) &&
        (differenceLeft === 0 || (differenceLeft > 0 && differenceLeft < 20) || (differenceLeft < 0 && differenceLeft > -20))) {
        return editor.bufferPositionForScreenPosition(screenPosition);
    }
    return null;
}
exports.getBufferPositionFromMouseEvent = getBufferPositionFromMouseEvent;
function mouseEventNearPosition({ event, editor, editorElement, tooltipElement, screenPosition, }) {
    const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event);
    const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition);
    const differenceTop = pixelPosition.top - expectedPixelPosition.top;
    const differenceLeft = pixelPosition.left - expectedPixelPosition.left;
    const editorLineHeight = editor.getLineHeightInPixels();
    const elementHeight = tooltipElement.offsetHeight + editorLineHeight;
    const elementWidth = tooltipElement.offsetWidth;
    if (differenceTop > 0) {
        if (differenceTop > elementHeight + 1.5 * editorLineHeight) {
            return false;
        }
    }
    else if (differenceTop < 0) {
        if (differenceTop < -1.5 * editorLineHeight) {
            return false;
        }
    }
    if (differenceLeft > 0) {
        if (differenceLeft > elementWidth + TOOLTIP_WIDTH_HIDE_OFFSET) {
            return false;
        }
    }
    else if (differenceLeft < 0) {
        if (differenceLeft < -1 * TOOLTIP_WIDTH_HIDE_OFFSET) {
            return false;
        }
    }
    return true;
}
exports.mouseEventNearPosition = mouseEventNearPosition;
function hasParent(givenElement, selector) {
    let element = givenElement;
    do {
        if (element.matches(selector)) {
            return true;
        }
        element = element.parentElement;
    } while (element && element.nodeName !== 'HTML');
    return false;
}
exports.hasParent = hasParent;
//# sourceMappingURL=helpers.js.map