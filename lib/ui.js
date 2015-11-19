'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './ui-panel'

export class LinterUI {

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
    this.editors = null
    this.panel = null

    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', showPanel => {
      if (this.panel) {
        this.panel.visibility = showPanel
      }
    }))
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'linter-ui-default:toggle-panel': function() {
        atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'))
      }
    }))
  }

  initialize(editors) {
    this.editors = editors
    this.panel = new Panel(atom.config.get('linter-ui-default.showPanel'))
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
