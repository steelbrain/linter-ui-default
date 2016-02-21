'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import type {Linter$Linter, Linter$Message} from './types'

export class LinterUI {
  name: string;
  messages: Array<Linter$Message>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
  }
  activate() {

  }
  didCalculateMessages({added, removed, messages}: {added: Array<Linter$Message>, removed: Array<Linter$Message>, messages: Array<Linter$Message>}) {

  }
  didBeginLinting(linter: Linter$Linter, filePath: string) {

  }
  didFinishLinting(linter: Linter$Linter, filePath: string) {

  }
  dispose() {
    if (this.panel) {
      this.panel.dispose()
    }
    this.subscriptions.dispose()
  }
}
