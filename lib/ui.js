'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './ui-panel'
import {Editor} from './ui-editor'

export class LinterUI {

  constructor() {
    this.name = 'Linter'
    this.subscriptions = new CompositeDisposable()
    this.editors = new Set()
    this.messages = []
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
      const editorPath = editorLinter.editor.getPath() || NaN
      this.subscriptions.add(editor)
      this.editors.add(editor)
      if (editorPath) {
        this.messages.forEach(function(message) {
          if (message.filePath === editorPath) {
            editor.addMessage(message)
          }
        })
      }
    }))
  }

  update({added, removed, messages}) {
    this.messages = messages
    const editors = this.getEditorsMap()

    if (added.length) {
      added.forEach(message => {
        this.panel.addMessage(message)
        if (message.filePath && message.range && typeof editors[message.filePath] !== 'undefined') {
          if (typeof editors[message.filePath].dispose === 'function') {
            editors[message.filePath].addMessage(message)
          } else {
            editors[message.filePath].forEach(editorUI => editorUI.addMessage(message))
          }
        }
      })
    }

    if(removed.length) {
      removed.forEach(message => {
        this.panel.removeMessage(message)
        if (message.filePath && message.range && typeof editors[message.filePath] !== 'undefined') {
          if (typeof editors[message.filePath].dispose === 'function') {
            editors[message.filePath].removeMessage(message)
          } else {
            editors[message.filePath].forEach(editorUI => editorUI.removeMessage(message))
          }
        }
      })
    }

    this.panel.updateEditorElements()
  }

  getEditorsMap() {
    const map = {}
    this.editors.forEach(function(editorUI) {
      const path = editorUI.editor.getPath()
      if (typeof map[path] === 'undefined') {
        map[path] = editorUI
      } else if (typeof map[path].dispose === 'function') {
        map[path] = [map[path], editorUI]
      } else {
        map[path].push(editorUI)
      }
    })
    return map
  }

  dispose() {
    this.panel = null
    this.messages = []
    this.editors.clear()
    this.subscriptions.dispose()
  }
}
