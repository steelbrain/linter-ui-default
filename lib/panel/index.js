/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable, Disposable } from 'atom'

import Delegate from './delegate'
import Component from './component'
import type { LinterMessage } from '../types'

class Panel {
  delegate: Delegate;
  subscriptions: CompositeDisposable;

  constructor() {
    this.subscriptions = new CompositeDisposable()

    const element = document.createElement('div')
    const panel = atom.workspace.addBottomPanel({
      item: element,
      visible: true,
      priority: 500,
    })
    this.subscriptions.add(new Disposable(function() {
      panel.destroy()
    }))

    this.delegate = new Delegate(panel)
    this.subscriptions.add(this.delegate)

    ReactDOM.render(<Component delegate={this.delegate} />, element)
  }
  update(messages: Array<LinterMessage>): void {
    this.delegate.update(messages)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}

module.exports = Panel
