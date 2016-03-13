'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Buffers from './buffers'
import type { Linter$Linter, Linter$Difference } from './types'

export default class LinterUI {
  name: string;
  buffers: Buffers;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.buffers = new Buffers()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.buffers)
  }
  activate() {
    this.buffers.activate()
  }
  didCalculateMessages(difference: Linter$Difference) {
    this.buffers.apply(difference)
  }
  didBeginLinting(/* linter: Linter$Linter, filePath: string */) {

  }
  didFinishLinting(/* linter: Linter$Linter, filePath: string */) {

  }
  dispose() {
    this.subscriptions.dispose()
  }
}
