'use babel'

export function createMessage(message) {
  const el = document.createElement('linter-message')
  el.initialize(message, true)
  return el
}
