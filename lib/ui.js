'use babel'

import {CompositeDisposable} from 'atom'

export class LinterUI {

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
  }

  initialize(editors) {
    this.editors = editors
  }

  update(messages) {
    console.log(messages)
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
