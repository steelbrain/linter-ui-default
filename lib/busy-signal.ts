import { CompositeDisposable } from 'atom'
const { config, project } = atom
import type { Linter } from './types'
import { BusySignalProvider, BusySignalRegistry } from 'atom-ide-base'

export default class BusySignal {
  provider: BusySignalProvider | null | undefined
  executing: Set<{
    linter: Linter
    filePath: string | null | undefined
  }> = new Set()
  providerTitles: Set<string> = new Set()
  useBusySignal: boolean = true
  subscriptions: CompositeDisposable = new CompositeDisposable()

  constructor() {
    this.subscriptions.add(
      config.observe('linter-ui-default.useBusySignal', (useBusySignal: boolean) => {
        this.useBusySignal = useBusySignal
      }),
    )
  }
  attach(registry: BusySignalRegistry) {
    this.provider = registry.create()
    this.update()
  }
  update() {
    const provider = this.provider
    if (!provider) {
      return
    }
    if (!this.useBusySignal) {
      return
    }
    const fileMap: Map<string | null | undefined, Array<string>> = new Map()
    const currentTitles = new Set()

    for (const { filePath, linter } of this.executing) {
      let names = fileMap.get(filePath)
      if (!names) {
        fileMap.set(filePath, (names = []))
      }
      names.push(linter.name)
    }

    for (const [filePath, names] of fileMap) {
      const path = typeof filePath === 'string' ? ` on ${project.relativizePath(filePath)[1]}` : ''
      names.forEach(name => {
        const title = `${name}${path}`
        currentTitles.add(title)
        if (!this.providerTitles.has(title)) {
          // Add the title since it hasn't been seen before
          this.providerTitles.add(title)
          provider.add(title)
        }
      })
    }

    // Remove any titles no longer active
    this.providerTitles.forEach(title => {
      if (!currentTitles.has(title)) {
        provider.remove(title)
        this.providerTitles.delete(title)
      }
    })

    fileMap.clear()
  }
  getExecuting(linter: Linter, filePath: string | null | undefined) {
    for (const entry of this.executing) {
      if (entry.linter === linter && entry.filePath === filePath) {
        return entry
      }
    }
    return null
  }
  didBeginLinting(linter: Linter, filePath: string | null | undefined) {
    if (this.getExecuting(linter, filePath)) {
      return
    }
    this.executing.add({ linter, filePath })
    this.update()
  }
  didFinishLinting(linter: Linter, filePath: string | null | undefined) {
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
    this.providerTitles.clear()
    this.executing.clear()
    this.subscriptions.dispose()
  }
}
