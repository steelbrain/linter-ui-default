'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Buffers from './buffers'
import Panel from './panel'
import type { /* Linter$Linter, */ Linter$Difference } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
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
    if (atom.config.get('linter-ui-default.showPanel')) {
      this.panel = new Panel()
      this.panel.activate()
      this.subscriptions.add(this.panel)
    }
  }
  didCalculateMessages(difference: Linter$Difference) {
    this.buffers.apply(difference)
    if (this.panel) {
      this.panel.apply(difference)
    }
  }
  didBeginLinting(/* linter: Linter$Linter, filePath: string */) {

  }
  didFinishLinting(/* linter: Linter$Linter, filePath: string */) {

  }
  dispose() {
    this.subscriptions.dispose()
  }
}
