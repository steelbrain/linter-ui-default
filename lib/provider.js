'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './panel'

export class LinterUI {
  constructor() {
    this.name = 'Linter'
    this.editors = new Set()
    this.editorRegistry = null
    this.panel = null
    this.subscriptions = new CompositeDisposable()
  }
  activate(editorRegistry) {
    this.editorRegistry = editorRegistry

    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', showPanel => {
      if (showPanel && !this.panel) {
        this.panel = new Panel()
        this.panel.onDidDestroy(() => {
          atom.config.set('linter-ui-default.showPanel', false)
        })
      } else if (!showPanel && this.panel) {
        this.panel.dispose()
        this.panel = null
      }
    }))
  }
  didCalculateMessages({added, removed, messages}) {

  }
  didBeginLinting(linter, filePath) {

  }
  didFinishLinting(linter, filePath) {

  }
  dispose() {
    this.editorRegistry = null
    if (this.panel) {
      this.panel.dispose()
    }
    this.subscriptions.dispose()
  }
}
