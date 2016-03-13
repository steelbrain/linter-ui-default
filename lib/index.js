'use babel'

import { CompositeDisposable } from 'atom'

module.exports = {
  activate() {
    const LinterUI = require('./main')
    this.ui = new LinterUI()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.ui)
  },
  deactivate() {
    this.subscriptions.dispose()
  },
  provideUI() {
    return this.ui
  }
}
