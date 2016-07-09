'use babel'

/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import LinterUI from './main'
import type Intentions from './intentions'

module.exports = {
  activate() {
    if (atom.inSpecMode()) {
      require('atom-package-deps').install('linter-ui-default')
    }
    this.ui = new LinterUI()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.ui)
  },
  deactivate() {
    this.subscriptions.dispose()
  },
  provideUI(): LinterUI {
    return this.ui
  },
  provideIntentions(): Intentions {
    return this.ui.intentions
  },
  consumeSignal(registry: Object) {
    this.ui.signalRegistry = registry
    if (this.ui.signal) {
      this.ui.signal.attach(registry)
    }
  },
}
