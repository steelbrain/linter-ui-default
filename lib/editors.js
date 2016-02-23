'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import {Editor} from './editor'
import type {TextBuffer, TextEditor} from 'atom'
import type {Linter$Message, Linter$Difference} from './types'

export class Editors {
  buffers: Set<TextBuffer>;
  messages: Array<Linter$Message>;
  textEditors: Map<TextEditor, Editor>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.buffers = new Set()
    this.messages = []
    this.textEditors = new Map()
    this.subscriptions = new CompositeDisposable()
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
