/* @flow */

export function getMessage(type: ?string = 'Error', filePath: ?string, range: ?Object): Object {
  const message: Object = {
    version: 2,
    severity: type.toLowerCase(),
    excerpt: String(Math.random()),
    location: { file: filePath, position: range },
  }

  return message
}

export function getLinter(name: ?string = 'some'): Object {
  return {
    name,
    grammarScopes: [],
    lint() {
      /* no operation */
    },
  }
}

export function dispatchCommand(target: Object, commandName: string) {
  atom.commands.dispatch(atom.views.getView(target), commandName)
}
