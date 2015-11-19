'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './ui-panel'
import {Editor} from './ui-editor'

export class LinterUI {

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
    this.editors = new Set()
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
    this.panel = new Panel(atom.config.get('linter-ui-default.showPanel'))
    this.subscriptions.add(this.panel)
    this.subscriptions.add(editors.observe(editorLinter => {
      const editor = new Editor(editorLinter)
      this.subscriptions.add(editor)
      this.editors.add(editor)
    }))
  }

  update({added, removed, messages}) {
    if (added.length) {
      added.forEach(message => {
        this.panel.addMessage(message)
      })
    }

    if(removed.length) {
      removed.forEach(message => {
        this.panel.removeMessage(message)
      })
    }

    this.panel.updateEditorElements()
  }

  dispose() {
    this.panel = null
    this.editors.clear()
    this.subscriptions.dispose()
  }
}
