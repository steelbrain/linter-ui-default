const { config, packages } = atom
import LinterUI from './main'
import type Intentions from './intentions'
import type { /* IntentionsListProvider, */ PackageExtra } from './types'
import type { StatusBar as StatusBarRegistry } from 'atom/status-bar'
import type { BusySignalRegistry } from 'atom-ide-base'

const idleCallbacks: Set<IdleCallbackHandle> = new Set()

const instances: Set<LinterUI> = new Set()
let signalRegistry: BusySignalRegistry | undefined
let statusBarRegistry: StatusBarRegistry | undefined

export function activate() {
  if (config.get('linter-ui-default.useBusySignal') as boolean) {
    // This is a necessary evil, see steelbrain/linter#1355
    ;(packages.getLoadedPackage('linter-ui-default') as PackageExtra).metadata['package-deps'].push('busy-signal')
  }

  const callbackID = window.requestIdleCallback(async () => {
    idleCallbacks.delete(callbackID)
    if (!atom.inSpecMode()) {
      await package_deps()
    }
  })
  idleCallbacks.add(callbackID)
}

/** Install Atom package dependencies if not already loaded */
async function package_deps() {
  // (to prevent loading atom-package-deps and package.json when the deps are already loaded)
  if (!atom.packages.isPackageLoaded('linter') || !atom.packages.isPackageLoaded('intentions')) {
    // install if not installed
    await (await import('atom-package-deps')).install('linter-ui-default', true)
    // enable if disabled
    atom.notifications.addInfo(`Enabling package linter and intentions that are needed for "linter-ui-default"`)
    atom.packages.enablePackage('linter')
    atom.packages.enablePackage('intentions')
  }
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
    instance.signal.attach(signalRegistry as BusySignalRegistry)
  })
}

export function consumeStatusBar(statusBarService: StatusBarRegistry) {
  statusBarRegistry = statusBarService
  instances.forEach(function (instance) {
    instance.statusBar.attach(statusBarRegistry as StatusBarRegistry)
  })
}
