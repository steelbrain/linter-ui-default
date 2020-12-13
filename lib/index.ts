import LinterUI from './main'
import type Intentions from './intentions'

const idleCallbacks: Set<any> = new Set()

let instances: Set<LinterUI> = new Set()
let signalRegistry: Object | null = null
let statusBarRegistry: Object | null = null

export function activate() {
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

export function provideIntentions(): Array<Intentions> {
  return Array.from(instances).map(entry => entry.intentions)
}

export function consumeSignal(signalRegistry: Object) {
  signalRegistry = signalRegistry
  instances.forEach(function (instance) {
    instance.signal.attach(signalRegistry)
  })
}

export function consumeStatusBar(statusBarRegistry: Object) {
  statusBarRegistry = statusBarRegistry
  instances.forEach(function (instance) {
    instance.statusBar.attach(statusBarRegistry)
  })
}
