'use babel'

import {CompositeDisposable} from 'atom'

export class LinterUI {
  static name = 'Linter'

  constructor(editors) {
    this.editors = editors
    this.subscriptions = new CompositeDisposable()
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
