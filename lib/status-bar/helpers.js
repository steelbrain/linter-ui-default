/* @flow */

// eslint-disable-next-line import/prefer-default-export
export function getElement(icon: string): HTMLElement {
  const element = document.createElement('a')
  const iconElement = document.createElement('span')

  iconElement.classList.add('icon')
  iconElement.classList.add(`icon-${icon}`)

  element.appendChild(iconElement)
  element.appendChild(document.createTextNode(''))

  return element
}
