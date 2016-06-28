'use babel'

export function getMessage(type = 'Error', filePath, range) {
  return { type, text: 'Some Message', filePath, range }
}

export function dispatchCommand(target: Object, commandName: string) {
  atom.commands.dispatch(atom.views.getView(target), commandName)
}

export function generateEvent(element: Element, name: string) {
  const event = document.createEvent('HTMLEvents')
  event.initEvent(name, true, false)
  return event
}
