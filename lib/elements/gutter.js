/* @flow */

const DEFAULT_ICON = 'primitive-dot'

export default function getElement(icon: ?string, severity: string): HTMLSpanElement {
  const element = document.createElement('span')
  element.className = `linter-gutter linter-highlight linter-${severity} icon icon-${icon || DEFAULT_ICON}`
  return element
}
