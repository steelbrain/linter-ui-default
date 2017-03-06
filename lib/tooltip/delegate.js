/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'

export default class TooltipDelegate {
  emitter: Emitter;
  subscriptions: CompositeDisposable;
  showProviderName: boolean;

  constructor() {
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-defalt.showProviderName', (showProviderName) => {
      const shouldUpdate = typeof this.showProviderName !== 'undefined'
      this.showProviderName = showProviderName
      if (shouldUpdate) {
        this.emitter.emit('should-update')
      }
    }))
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linter-ui-default:expand-tooltip': () => {
        this.emitter.emit('should-expand')
      },
      'linter-ui-default:collapse-tooltip': () => {
        this.emitter.emit('should-collapse')
      },
    }))
  }
  onShouldUpdate(callback: (() => any)): Disposable {
    return this.emitter.on('should-update', callback)
  }
  onShouldExpand(callback: (() => any)): Disposable {
    return this.emitter.on('should-expand', callback)
  }
  onShouldCollapse(callback: (() => any)): Disposable {
    return this.emitter.on('should-collapse', callback)
  }
  dispose() {
    this.emitter.dispose()
  }
}
