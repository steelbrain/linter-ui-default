import LinterUI from './main'
import type Intentions from './intentions'
import type { /* IntentionsListProvider, */ RequestIdleCallbackHandle, PackageExtra } from './types'
import type { StatusBar as StatusBarRegistry } from 'atom/status-bar'
import type { BusySignalRegistry } from 'atom-ide-base'

const idleCallbacks: Set<RequestIdleCallbackHandle> = new Set()

const instances: Set<LinterUI> = new Set()
let signalRegistry: BusySignalRegistry
let statusBarRegistry: StatusBarRegistry

export function activate() {
  if (atom.config.get('linter-ui-default.useBusySignal')) {
    // This is a necessary evil, see steelbrain/linter#1355
    ;(atom.packages.getLoadedPackage('linter-ui-default') as PackageExtra).metadata['package-deps'].push('busy-signal')
  }

  const callbackID = window.requestIdleCallback(function installLinterUIDefaultDeps() {
    idleCallbacks.delete(callbackID)
    if (!atom.inSpecMode()) {
      const { install } = require('atom-package-deps')
      install('linter-ui-default')
    }
  })
  idleCallbacks.add(callbackID)
}

export function deactivate() {
  idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID))
  idleCallbacks.clear()
  for (const entry of instances) {
    entry.dispose()
  }
  instances.clear()
}

export function provideUI(): LinterUI {
  const instance = new LinterUI()
  instances.add(instance)
  if (signalRegistry) {
    instance.signal.attach(signalRegistry)
  }
  return instance
}

// TODO: use IntentionsListProvider as the return type
export function provideIntentions(): Array<Intentions> {
  return Array.from(instances).map(entry => entry.intentions)
}

export function consumeSignal(signalService: BusySignalRegistry) {
  signalRegistry = signalService
  instances.forEach(function (instance) {
    instance.signal.attach(signalRegistry)
  })
}

export function consumeStatusBar(statusBarService: StatusBarRegistry) {
  statusBarRegistry = statusBarService
  instances.forEach(function (instance) {
    instance.statusBar.attach(statusBarRegistry)
  })
}
