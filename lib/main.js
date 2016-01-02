'use babel'

import {CompositeDisposable} from 'atom'
import {Panel} from './panel'
import {getEditorsMap} from './helpers'
import {Editor} from './editor'

export class LinterUI {
  constructor() {
    this.name = 'Linter'
    this.editors = new Set()
    this.panel = null
    this.messages = []
    this.subscriptions = new CompositeDisposable()
  }
  activate() {
    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', showPanel => {
      if (showPanel && !this.panel) {
        this.panel = new Panel()
        this.panel.onDidDestroy(() => {
          atom.config.set('linter-ui-default.showPanel', false)
        })
        this.panel.updateMessages({added: this.messages, removed: [], messages: this.messages})
      } else if (!showPanel && this.panel) {
        this.panel.dispose()
        this.panel = null
      }
    }))
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      const editor = new Editor(textEditor)

      this.editors.add(editor)
      this.subscriptions.add(editor)

      editor.onDidDestroy(() => {
        this.subscriptions.remove(editor)
        this.editors.delete(editor)
      })

      const editorPath = editor.editor.getPath()

      if (editorPath) {
        const editorMessages = []
        const currentMessages = this.messages
        const currentMessagesLength = this.messages.length
        for (let i = 0; i < currentMessagesLength; ++i) {
          const message = currentMessages[i]
          if (message.filePath === editorPath) {
            editorMessages.push(message)
          }
        }
        editor.updateMessages({added: editorMessages, removed: []})
      }
    }))
  }
  didCalculateMessages({added, removed, messages}) {
    this.messages = messages

    if (added.length || removed.length) {
      const {editors, diff, activePaths} = getEditorsMap(this.editors)
      const addedLength = added.length
      const removedLength = removed.length

      if (addedLength)
      for (let i = 0; i < addedLength; ++i) {
        const message = added[i]
        if (message.filePath && message.range && activePaths.has(message.filePath)) {
          diff[message.filePath].added.push(message)
        }
      }

      if (removedLength)
      for (let i = 0; i < removedLength; ++i) {
        const message = removed[i]
        if (message.filePath && message.range && activePaths.has(message.filePath)) {
          diff[message.filePath].removed.push(message)
        }
      }

      for (const activePath of activePaths) {
        const selectedEditors = editors[activePath]
        const selectedEditorsLength = selectedEditors.length
        if (selectedEditorsLength === 1) {
          selectedEditors[0].updateMessages(diff[activePath])
        } else if (selectedEditorsLength === 2) {
          selectedEditors[0].updateMessages(diff[activePath])
          selectedEditors[1].updateMessages(diff[activePath])
        } else {
          for (let i = 0; i < selectedEditorsLength; ++i) {
            selectedEditors[i].updateMessages(diff[activePath])
          }
        }
      }

      if (this.panel) {
        this.panel.updateMessages({added, removed, messages})
      }
    }
  }
  didBeginLinting(linter, filePath) {

  }
  didFinishLinting(linter, filePath) {

  }
  dispose() {
    this.messages = []
    if (this.panel) {
      this.panel.dispose()
    }
    this.subscriptions.dispose()
  }
}
