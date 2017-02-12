/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import disposify from 'disposify'

import Element from './element'
import type { LinterMessage } from '../types'

export default class StatusBar {
  element: Element;
  subscriptions: CompositeDisposable;

  constructor() {
    this.element = new Element()
    this.subscriptions = new CompositeDisposable()
  }
  update(messages: Array<LinterMessage>): void {
    const count = { error: 0, warning: 0, info: 0 }
    messages.forEach(function(message) {
      if (message.severity === 'error') {
        count.error++
      } else if (message.severity === 'warning') {
        count.warning++
      } else if (message.severity === 'info') {
        count.info++
      }
    })
    this.element.update(count.error, count.warning, count.info)
  }
  attach(statusBarRegistry: Object) {
    this.subscriptions.add(disposify(statusBarRegistry.addLeftTile({
      item: this.element.item,
      priority: 5,
    })))
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
