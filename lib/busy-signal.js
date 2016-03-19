'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import type { Linter$Linter } from './types'

export default class BusySignal {
  provider: ?Object;
  inProgress: Map<?string, Set<Linter$Linter>>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.inProgress = new Map()
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
    for (const [filePath, linters] of this.inProgress) {
      const names = []
      for (const linter of linters) {
        names.push(linter.name || 'Unknown')
      }
      const ps = filePath ? `on ${filePath}` : ''
      provider.add(`Linter(s) ${names.join(', ')} running ${ps}`)
    }
  }
  didBeginLinting(linter: Linter$Linter, filePath: string) {
    let beingExecuted = this.inProgress.get(filePath)
    if (!beingExecuted) {
      beingExecuted = new Set()
      this.inProgress.set(filePath, beingExecuted)
    }
    beingExecuted.add(linter)
    this.update()
  }
  didFinishLinting(linter: Linter$Linter, filePath: string) {
    const beingExecuted = this.inProgress.get(filePath)
    if (beingExecuted) {
      beingExecuted.delete(linter)
      if (!beingExecuted.size) {
        this.inProgress.delete(filePath)
      }
      this.update()
    }
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
