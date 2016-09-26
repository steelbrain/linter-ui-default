/* @flow */

import LinterUI from './main'
import type Intentions from './intentions'

const linterUiDefault = {
  ui: new Set(),
  signalRegistry: null,
  activate() {
    if (!atom.inSpecMode()) {
      // eslint-disable-next-line global-require
      require('atom-package-deps').install('linter-ui-default')
    }
  },
  deactivate() {
    for (const entry of this.ui) {
      entry.dispose()
    }
  },
  provideUI(): LinterUI {
    const ui = new LinterUI()
    this.ui.add(ui)
    if (this.signalRegistry) {
      ui.signal.attach(this.signalRegistry)
    }
    return ui
  },
  provideIntentions(): Array<Intentions> {
    return Array.from(this.ui).map(entry => entry.intentions)
  },
  consumeSignal(signalRegistry: Object) {
    this.signalRegistry = signalRegistry
    this.ui.forEach(function(ui) {
      ui.signal.attach(signalRegistry)
    })
  },
}

module.exports = linterUiDefault
