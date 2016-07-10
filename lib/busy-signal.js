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
      const ps = filePath ? `on ${filePath}` : ''
      provider.add(`Linters (${names.join(', ')}) running ${ps}`)
    }
    fileMap.clear()
  }
  didBeginLinting(linter: Linter, filePath: ?string) {
    this.inProgress.add({ linter, filePath })
    this.update()
  }
  didFinishLinting(linter: Linter, filePath: ?string) {
    for (const entry of this.inProgress) {
      if (entry.linter === linter && entry.filePath === filePath) {
        this.inProgress.delete(entry)
        this.update()
        break
      }
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
