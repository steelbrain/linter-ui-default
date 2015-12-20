'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './panel'
import {getEditorsMap} from './helpers'
import {Editor} from './editor'

export class LinterUI {
  constructor() {
    this.name = 'Linter'
    this.editors = new Set()
    this.editorRegistry = null
    this.panel = null
    this.messages = []
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
    this.subscriptions.add(editorRegistry.observe(editorLinter => {
      const editor = new Editor(editorLinter)

      this.editors.add(editor)
      this.subscriptions.add(editor)

      editor.onDidDestroy(() => {
        this.subscriptions.remove(editor)
        this.editors.delete(editor)
      })

      const editorPath = editor.editor.getPath()

      if (editorPath) {
        const editorMessages = []
        this.messages.forEach(function(message) {
          if (message.filePath === editorPath) {
            editorMessages.push(message)
          }
        })
        editor.updateMessages({added: editorMessages, removed: []})
      }
    }))
  }
  didCalculateMessages({added, removed, messages}) {
    this.messages = messages

    if (added.length || removed.length) {
      let {editors, diff, activePaths} = getEditorsMap(this.editors)
      const addedLength = added.length
      const removedLength = removed.length

      if (addedLength)
      for (let i = 0; i < addedLength; ++i) {
        const message = added[i]
        if (message.filePath && activePaths.has(message.filePath)) {
          diff[message.filePath].added.push(message)
        }
      }

      if (removedLength)
      for (let i = 0; i < removedLength; ++i) {
        const message = removed[i]
        if (message.filePath && activePaths.has(message.filePath)) {
          diff[message.filePath].removed.push(message)
        }
      }

      activePaths.forEach(function(path) {
        const selectedEditors = editors[path]
        const selectedEditorsLength = selectedEditors.length
        if (selectedEditorsLength === 1) {
          selectedEditors[0].updateMessages(diff[path])
        } else {
          for (let i = 0; i < selectedEditorsLength; ++i) {
            selectedEditors[i].updateMessages(diff[path])
          }
        }
      })

      if (this.panel) {
        this.panel.updateMessages({added, removed})
      }

      activePaths = null
      editors = null
      diff = null
    }
  }
  didBeginLinting(linter, filePath) {

  }
  didFinishLinting(linter, filePath) {

  }
  dispose() {
    this.editorRegistry = null
    this.messages = []
    if (this.panel) {
      this.panel.dispose()
    }
    this.subscriptions.dispose()
  }
}
