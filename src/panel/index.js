/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable, Disposable } from 'sb-event-kit'

import Element from './element'
import Delegate from './delegate'
import type { LinterMessage } from '../types'

export default class Panel {
  delegate: Delegate;
  subscriptions: CompositeDisposable;

  constructor() {
    this.delegate = new Delegate()
    this.subscriptions = new CompositeDisposable()


    const element = document.createElement('linter-panel')
    const panel = atom.workspace.addBottomPanel({
      item: element,
      visible: true,
      priority: 500,
    })
    ReactDOM.render(<Element delegate={this.delegate} />, element)
    this.subscriptions.add(new Disposable(function() {
      panel.destroy()
    }))
    this.subscriptions.add(this.delegate)
  }
  update(messages: Array<LinterMessage>): void {
    this.delegate.update(messages)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
