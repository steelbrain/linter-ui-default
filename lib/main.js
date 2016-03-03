'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import type {Linter$Linter, Linter$Difference} from './types'

export class LinterUI {
  name: string;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
  }
  activate() {

  }
  didCalculateMessages(difference: Linter$Difference) {

  }
  didBeginLinting(linter: Linter$Linter, filePath: string) {

  }
  didFinishLinting(linter: Linter$Linter, filePath: string) {

  }
  dispose() {
    this.subscriptions.dispose()
  }
}
