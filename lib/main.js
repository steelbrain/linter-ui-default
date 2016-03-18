'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Buffers from './buffers'
import Panel from './panel'
import Intentions from './intentions'
import type { /* Linter$Linter, */ Linter$Difference } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
  active: boolean;
  buffers: Buffers;
  intentions: Intentions;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.intentions = new Intentions()
    this.initialize()

    this.intentions.onShouldProvideBuffer(event => {
      event.buffer = this.buffers.getByBuffer(event.textBuffer)
    })
  }
  initialize() {
    this.active = true
    this.buffers = new Buffers()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.buffers)
  }
  activate() {
    if (!this.active) {
      this.initialize()
    }
    this.buffers.activate()
    if (atom.config.get('linter-ui-default.showPanel')) {
      this.panel = new Panel()
      this.subscriptions.add(this.panel)
    }
    this.buffers.onShouldRender(() => {
      if (this.panel) {
        this.panel.apply()
      }
    })
  }
  didCalculateMessages(difference: Linter$Difference) {
    this.buffers.apply(difference)
    if (this.panel) {
      this.panel.apply(difference.messages)
    }
  }
  didBeginLinting(/* linter: Linter$Linter, filePath: string */) {

  }
  didFinishLinting(/* linter: Linter$Linter, filePath: string */) {

  }
  dispose() {
    this.active = false
    this.subscriptions.dispose()
  }
}
