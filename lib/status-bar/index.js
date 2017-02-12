/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import disposify from 'disposify'

import Element from './element'
import { $file } from '../helpers'
import type { LinterMessage } from '../types'

export default class StatusBar {
  element: Element;
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;
  statusBarRepresents: 'Entire Project' | 'Current File';
  statusBarClickBehavior: 'Toggle Panel' | 'Jump to next error';

  constructor() {
    this.element = new Element()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarRepresents', statusBarRepresents => {
      const shouldUpdate = typeof this.statusBarRepresents !== 'undefined'
      this.statusBarRepresents = statusBarRepresents
      if (shouldUpdate) {
        this.update(this.messages)
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarClickBehavior', statusBarClickBehavior => {
      const shouldUpdate = typeof this.statusBarClickBehavior !== 'undefined'
      this.statusBarClickBehavior = statusBarClickBehavior
      if (shouldUpdate) {
        this.update(this.messages)
      }
    }))

    this.subscriptions.add(atom.tooltips.add(this.element.itemErrors, { title: 'Linter Errors' }))
    this.subscriptions.add(atom.tooltips.add(this.element.itemWarnings, { title: 'Linter Warnings' }))
    this.subscriptions.add(atom.tooltips.add(this.element.itemInfos, { title: 'Linter Infos' }))
  }
  update(messages: Array<LinterMessage>): void {
    this.messages = messages

    const count = { error: 0, warning: 0, info: 0 }
    const currentTextEditor = atom.workspace.getActiveTextEditor()
    const currentPath = (currentTextEditor && currentTextEditor.getPath()) || NaN

    messages.forEach((message) => {
      if (this.statusBarRepresents === 'Entire Project' || $file(message) === currentPath) {
        if (message.severity === 'error') {
          count.error++
        } else if (message.severity === 'warning') {
          count.warning++
        } else if (message.severity === 'info') {
          count.info++
        }
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
