/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import type { Linter } from './types'

export default class BusySignal {
  provider: ?Object;
  inProgress: Set<{
    linter: Linter,
    filePath: ?string,
  }>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.inProgress = new Set()
    this.subscriptions = new CompositeDisposable()
  }
  attach(registry: Object) {
    this.provider = registry.create()
    this.update()
  }
  update() {
    const provider = this.provider
    if (!provider) {
      return
    }
    provider.clear()
    const fileMap: Map<?string, Array<string>> = new Map()
    for (const { filePath, linter } of this.inProgress) {
      let fileMapEntry = fileMap.get(filePath)
      if (!fileMapEntry) {
        fileMap.set(filePath, fileMapEntry = [])
      }
      fileMapEntry.push(linter.name)
    }
    for (const [filePath, names] of fileMap) {
      const ps = filePath ? ` on ${atom.project.relativizePath(filePath)[1]}` : ''
      provider.add(`Linters (${names.join(', ')}) running${ps}`)
    }
    fileMap.clear()
  }
  getInProgress(linter: Linter, filePath: ?string): ?Object {
    for (const entry of this.inProgress) {
      if (entry.linter === linter && entry.filePath === filePath) {
        return entry
      }
    }
    return null
  }
  didBeginLinting(linter: Linter, filePath: ?string) {
    if (this.getInProgress(linter, filePath)) {
      return
    }
    this.inProgress.add({ linter, filePath })
    this.update()
  }
  didFinishLinting(linter: Linter, filePath: ?string) {
    const entry = this.getInProgress(linter, filePath)
    if (entry) {
      this.inProgress.delete(entry)
      this.update()
    }
  }
  dispose() {
    if (this.provider) {
      this.provider.clear()
    }
    this.inProgress.clear()
    this.subscriptions.dispose()
  }
}
