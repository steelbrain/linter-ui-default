/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable } from 'sb-event-kit'

import Delegate from './delegate'
import Component from './component'
import type { LinterMessage } from '../types'

export default class Panel {
  delegate: Delegate;
  subscriptions: CompositeDisposable;

  constructor() {
    this.delegate = new Delegate()
    this.subscriptions = new CompositeDisposable()

    const element = document.createElement('div')
    const panel = atom.workspace.addBottomPanel({
      item: element,
      visible: true,
      priority: 500,
    })
    ReactDOM.render(<Component delegate={this.delegate} />, element)
    this.subscriptions.add(function() {
      panel.destroy()
    })
    this.subscriptions.add(this.delegate)
  }
  update(messages: Array<LinterMessage>): void {
    this.delegate.update(messages)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
