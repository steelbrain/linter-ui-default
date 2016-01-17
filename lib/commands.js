'use babel'

import {CompositeDisposable} from 'atom'

export class Commands {
  constructor() {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
      'linter-ui-default:toggle-panel': () => this.togglePanel()
    }))
  }
  togglePanel() {
    atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'))
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
