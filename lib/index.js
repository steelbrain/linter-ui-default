'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import LinterUI from './main'

module.exports = {
  activate() {
    this.ui = new LinterUI()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.ui)
  },
  deactivate() {
    this.subscriptions.dispose()
  },
  provideUI(): LinterUI {
    return this.ui
  }
}
