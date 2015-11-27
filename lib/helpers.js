'use babel'

export function createMessage(message) {
  const el = document.createElement('linter-message')
  el.initialize(message, true)
  return el
}

export function createBubble(message) {
  const bubble = document.createElement('div')
  bubble.id = 'linter-inline'
  bubble.appendChild(createMessage(message, false))
  if (message.trace && message.trace.length) {
    message.trace.forEach(function(trace) {
      bubble.appendChild(createMessage(trace).updateVisibility('Project'))
    })
  }
  return bubble
}
