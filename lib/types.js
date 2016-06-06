'use babel'

/* @flow */

export type Config$ShowIssues = 'All Files' | 'Current File' | 'Current Line';

export type Linter = {
  name: string,
  scope: 'file' | 'project',
  grammarScopes: Array<string>,
  lint: ((textEditor: TextEditor) => ?Array<Message> | Promise<?Array<Message>>),
}

export type MessagesPatch = {
  added: Array<Message>,
  removed: Array<Message>,
  messages: Array<Message>,
}

export type Message = {
  location: {
    file: string,
    position: Range,
  },
  source: ?{
    file: string,
    position?: Point,
  },
  excerpt: string,
  severity: 'error' | 'warning' | 'info',
  reference: ?string,
  solutions: ?Array<{
    title: string,
    position: Range,
    currentText: ?string,
    replaceWith: string,
  }>,
  description: ?Array<string>,
}
