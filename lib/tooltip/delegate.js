/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'

export default class TooltipDelegate {
  emitter: Emitter;
  expanded: boolean;
  subscriptions: CompositeDisposable;
  showProviderName: boolean;

  constructor() {
    this.emitter = new Emitter()
    this.expanded = false
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', (showProviderName) => {
      const shouldUpdate = typeof this.showProviderName !== 'undefined'
      this.showProviderName = showProviderName
      if (shouldUpdate) {
        this.emitter.emit('should-update')
      }
    }))
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'linter-ui-default:expand-tooltip': (event) => {
        if (this.expanded) {
          return
        }
        this.expanded = true
        this.emitter.emit('should-expand')

        // If bound to a key, collapse when that key is released, just like old times
        if (event.originalEvent && event.originalEvent.isTrusted) {
          document.body.addEventListener('keyup', function eventListener() {
            document.body.removeEventListener('keyup', eventListener)
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'linter-ui-default:collapse-tooltip')
          })
        }
      },
      'linter-ui-default:collapse-tooltip': () => {
        this.expanded = false
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
