/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable } from 'atom'

import Delegate from './delegate'
import Component from './component'
import type { LinterMessage } from '../types'

class Panel {
  element: HTMLElement;
  delegate: Delegate;
  subscriptions: CompositeDisposable;

  constructor() {
    this.subscriptions = new CompositeDisposable()

    this.element = document.createElement('div')
    this.delegate = new Delegate({ uri: this.getURI() })
    this.subscriptions.add(this.delegate)

    ReactDOM.render(<Component delegate={this.delegate} />, this.element)

    atom.workspace.open(this)
  }
  getURI() {
    return 'atom://linter-ui-default'
  }
  getTitle() {
    return 'Linter'
  }
  getDefaultLocation() {
    return 'bottom'
  }
  getAllowedLocations() {
    return ['center', 'bottom', 'top']
  }
  update(messages: Array<LinterMessage>): void {
    this.delegate.update(messages)
  }
  destroy() {
    atom.config.set('linter-ui-default.showPanel', false)
  }
  getPreferredHeight() {
    return 100
  }
  dispose() {
    this.subscriptions.dispose()
    atom.workspace.getPanes().forEach((pane) => {
      pane.destroyItem(this)
    })
  }
}

module.exports = Panel
