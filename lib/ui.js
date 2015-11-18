'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './ui-panel'

export class LinterUI {

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
    this.editors = null
    this.panel = null
  }

  initialize(editors) {
    this.editors = editors
    this.panel = new Panel(true)
    // TODO: Replace true with a real world config ^
    this.subscriptions.add(this.panel)
  }

  update(messages) {
    console.log(messages)
  }

  dispose() {
    this.editors = null
    this.panel = null
    this.subscriptions.dispose()
  }
}
