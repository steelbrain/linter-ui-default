/* @flow */

import { TextEditor, Point, Range } from 'atom'

export type Config$ShowIssues = 'All Files' | 'Current File' | 'Current Line';

export type Message = {
  key: string, // <-- Automatically added
  version: 2, // <-- Automatically added
  linterName: string, // <-- Automatically added

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
  solutions?: Array<{
    title?: string,
    position: Range,
    currentText?: string,
    replaceWith: string,
  } | {
    title?: string,
    position: Range,
    apply: (() => any),
  }>,
  description?: Array<string>,
}

export type MessageLegacy = {
  key: string, // <-- Automatically Added
  version: 1, // <-- Automatically added
  linterName: string, // <-- Automatically added

  type: string,
  text?: string,
  html?: string,
  filePath?: string,
  range?: Range,
  class?: string,
  severity: 'error' | 'warning' | 'info',
  trace?: Array<MessageLegacy>,
  fix?: {
    range: Range,
    newText: string,
    oldText?: string
  }
}

export type LinterMessage = Message | MessageLegacy

export type Linter = {
  name: string,
  scope: 'file' | 'project',
  lintOnFly: boolean,
  grammarScopes: Array<string>,
  lint: ((textEditor: TextEditor) => ?Array<Message> | Promise<?Array<Message>>),
}

export type MessagesPatch = {
  added: Array<Message | MessageLegacy>,
  removed: Array<Message | MessageLegacy>,
  messages: Array<Message | MessageLegacy>,
}

export type TreeViewHighlight = {
  info: boolean,
  error: boolean,
  warning: boolean,
}
