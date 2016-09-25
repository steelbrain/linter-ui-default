/* @flow */

// NOTE: Code Point 160 === &nbsp;
const replacementRegex = new RegExp(String.fromCodePoint(160), 'g')

// eslint-disable-next-line import/prefer-default-export
export function htmlToText(html: any) {
  const element = document.createElement('div')
  if (typeof html === 'string') {
    element.innerHTML = html
  } else {
    element.appendChild(html.cloneNode(true))
  }
  // NOTE: Convert &nbsp; to regular whitespace
  return element.textContent.replace(replacementRegex, ' ')
}
