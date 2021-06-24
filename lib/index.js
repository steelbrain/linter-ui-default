/* @flow */

import LinterUI from './main'
import type Intentions from './intentions'

const idleCallbacks: Set<any> = new Set()

type LinterUIDefault = {
  instances: Set<LinterUI>,
  signalRegistry: Object | null,
  statusBarRegistry: Object | null,
}

const linterUiDefault: LinterUIDefault = {
  instances: new Set(),
  signalRegistry: null,
  statusBarRegistry: null,
  activate() {
    if (atom.config.get('linter-ui-default.useBusySignal')) {
      // This is a necessary evil, see steelbrain/linter#1355
      atom.packages.getLoadedPackage('linter-ui-default').metadata['package-deps'].push('busy-signal')
    }

    const callbackID = window.requestIdleCallback(function installLinterUIDefaultDeps() {
      idleCallbacks.delete(callbackID)
      if (!atom.inSpecMode()) {
        // eslint-disable-next-line global-require
        require('atom-package-deps').install('linter-ui-default')
      }
    })
    idleCallbacks.add(callbackID)
  },
  deactivate() {
    idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID))
    idleCallbacks.clear()
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
  consumeStatusBar(statusBarRegistry: Object) {
    this.statusBarRegistry = statusBarRegistry
    this.instances.forEach(function(instance) {
      instance.statusBar.attach(statusBarRegistry)
    })
  },
}

module.exports = linterUiDefault
