/* @flow */

export default function getElement(messageClass: string): HTMLSpanElement {
  const element = document.createElement('span')
  element.className = `linter-gutter linter-highlight ${messageClass}`
  return element
}
