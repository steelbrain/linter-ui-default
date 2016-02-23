'use babel'

/* @flow */

import {CompositeDisposable} from 'atom'
import {Editors} from './editors'
import type {Linter$Linter, Linter$Difference} from './types'

export class LinterUI {
  name: string;
  editors: Editors;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.editors = new Editors()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.editors)
  }
  activate() {
    this.editors.activate()
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
