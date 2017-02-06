/* @flow */

import LinterUI from './main'
import type Intentions from './intentions'

const linterUiDefault = {
  instances: new Set(),
  signalRegistry: null,
  activate() {
    if (!atom.inSpecMode()) {
      // eslint-disable-next-line global-require
      require('atom-package-deps').install('linter-ui-default')
    }
  },
  deactivate() {
    for (const entry of this.instances) {
      entry.dispose()
    }
    this.instances.clear()
  },
  provideUI(): LinterUI {
    const instance = new LinterUI()
    this.instances.add(instance)
    if (this.signalRegistry) {
      instance.signal.attach(this.signalRegistry)
    }
    return instance
  },
  provideIntentions(): Array<Intentions> {
    return Array.from(this.instances).map(entry => entry.intentions)
  },
  consumeSignal(signalRegistry: Object) {
    this.signalRegistry = signalRegistry
    this.instances.forEach(function(instance) {
      instance.signal.attach(signalRegistry)
    })
  },
}

module.exports = linterUiDefault
