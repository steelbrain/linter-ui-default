'use babel'

const KEY_SHOW_PANEL = 'linter-ui-default.showPanel'

import {CompositeDisposable} from 'atom'
import {Panel} from './ui-panel'

export class LinterUI {

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
    this.editors = null
    this.panel = null

    this.subscriptions.add(atom.config.observe(KEY_SHOW_PANEL, showPanel => {
      if (this.panel) {
        this.panel.visibility = showPanel
      }
    }))
  }

  initialize(editors) {
    this.editors = editors
    this.panel = new Panel(atom.config.get(KEY_SHOW_PANEL))
    this.subscriptions.add(this.panel)
  }

  update(messages) {
    this.panel.update(messages)
  }

  dispose() {
    this.editors = null
    this.panel = null
    this.subscriptions.dispose()
  }
}
