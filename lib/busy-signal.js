/* @flow */

import { CompositeDisposable } from 'atom'
import type { Linter } from './types'

class BusySignal {
  provider: ?Object;
  executing: Set<{
    linter: Linter,
    filePath: ?string,
  }>;
  useBusySignal: boolean;
  subscriptions: CompositeDisposable;

  constructor() {
    this.executing = new Set()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe('linter-ui-default.useBusySignal', (useBusySignal) => {
      this.useBusySignal = useBusySignal
    }))
  }
  attach(registry: Object) {
    this.provider = registry.create()
    this.update()
  }
  update() {
    const provider = this.provider
    if (!provider) return
    provider.clear()
    if (!this.useBusySignal) return
    const fileMap: Map<?string, Array<string>> = new Map()

    for (const { filePath, linter } of this.executing) {
      let names = fileMap.get(filePath)
      if (!names) {
        fileMap.set(filePath, names = [])
      }
      names.push(linter.name)
    }

    for (const [filePath, names] of fileMap) {
      const path = filePath ? ` on ${atom.project.relativizePath(filePath)[1]}` : ''
      provider.add(`${names.join(', ')}${path}`)
    }
    fileMap.clear()
  }
  getExecuting(linter: Linter, filePath: ?string): ?Object {
    for (const entry of this.executing) {
      if (entry.linter === linter && entry.filePath === filePath) {
        return entry
      }
    }
    return null
  }
  didBeginLinting(linter: Linter, filePath: ?string) {
    if (this.getExecuting(linter, filePath)) {
      return
    }
    this.executing.add({ linter, filePath })
    this.update()
  }
  didFinishLinting(linter: Linter, filePath: ?string) {
    const entry = this.getExecuting(linter, filePath)
    if (entry) {
      this.executing.delete(entry)
      this.update()
    }
  }
  dispose() {
    if (this.provider) {
      this.provider.clear()
    }
    this.executing.clear()
    this.subscriptions.dispose()
  }
}

module.exports = BusySignal
