/* @flow */

export function getMessage(type: ?string = 'Error', filePath: ?string, range: ?Object): Object {
  return { type, text: 'Some Message', filePath, range, version: 1 }
}

export function getLinter(): Object {
  return {
    name: 'some',
    grammarScopes: [],
    lint() {},
  }
}

export function dispatchCommand(target: Object, commandName: string) {
  atom.commands.dispatch(atom.views.getView(target), commandName)
}
