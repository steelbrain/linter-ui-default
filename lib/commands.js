'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'

export default class Commands {
  subscriptions: CompositeDisposable;

  constructor() {
    this.subscriptions = new CompositeDisposable()
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
