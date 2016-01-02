'use babel'

import {Emitter, CompositeDisposable} from 'atom'
import {PanelElement} from './elements/panel'
import {getMessageElement} from './elements/message'

export class Panel {
  constructor() {
    this.element = new PanelElement()
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.panel = atom.workspace.addBottomPanel({
      item: this.element.element,
      visible: this.visibility,
      priority: 500
    })
    this.messages = []
    this.messageElements = new Map()
    this.editorElements = {}
    this.visibility = true
    this.visibleMessages = 0
    this.showAll = atom.config.get('linter-ui-default.showIssuesFromAllFiles')

    this.subscriptions.add(this.element)
    this.subscriptions.add(this.emitter)

    this.element.onDidDestroy(() => {
      this.destroy()
    })
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(paneItem => {
      this.visibility = paneItem && typeof paneItem.getText === 'function'
      const currentVisibility = this.panel.isVisible()
      if (this.visibility && !currentVisibility) {
        this.panel.show()
      } else if (!this.visibility && currentVisibility) {
        this.panel.hide()
      }

      if (this.visibility && !this.showAll) {
        this.reRenderMessages()
      }
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.showIssuesFromAllFiles', ({newValue}) => {
      this.showAll = newValue
      this.reRenderMessages()
    }))

    this.getEditorElement(null) // <-- For messages with no file path
  }
  getEditorElement(path) {
    if (this.editorElements[path]) {
      return this.editorElements[path]
    }
    const element = document.createElement('div')
    element.setAttribute('data-path', path)
    // ^ helps while debugging
    this.element.content.appendChild(element)
    this.editorElements[path] = element
    return element
  }
  reRenderMessages() {
    this.updateMessages({added: [], removed: this.messages, messages: this.messages})
    this.updateMessages({added: this.messages, removed: [], messages: this.messages})
  }
  updateMessages({added, removed, messages}) {
    const activeEditor = atom.workspace.getActiveTextEditor()
    const activePath = (activeEditor ? activeEditor.getPath() : null) || NaN
    const editorElements = this.editorElements
    const addedLength = added.length
    const removedLength = removed.length

    if (addedLength)
    for (let i = 0; i < addedLength; ++i) {
      const message = added[i]
      const messageElement = getMessageElement(message)
      if (this.showAll || activePath === message.filePath) {
        const editorElement = editorElements[message.filePath] || this.getEditorElement(message.filePath)
        this.messageElements.set(message, messageElement)

        editorElement.appendChild(messageElement.element)
        this.visibleMessages++
      }
    }

    if (removedLength)
    for (let i = 0; i < removedLength; ++i) {
      const message = removed[i]
      const messageElement = this.messageElements.get(message)
      if (messageElement) {
        messageElement.element.remove()
        messageElement.dispose()
        this.messageElements.delete(message)
        this.visibleMessages--
      }
    }

    if (addedLength || removedLength)
    for (let path in this.editorElements) {
      const editorElement = this.editorElements[path]
      if (path !== 'null' && editorElement !== null && !editorElement.childNodes.length) {
        editorElement.remove()
        this.editorElements[path] = null
      }
    }

    const content = this.element.content
    if (this.visibleMessages && content.classList.contains('empty')) {
      content.classList.remove('empty')
    } else if (!this.visibleMessages && !content.classList.contains('empty')) {
      content.classList.add('empty')
    }
    this.element.count = this.visibleMessages
    this.messages = messages
  }
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback)
  }
  destroy() {
    this.emitter.emit('did-destroy')
    this.dispose()
  }
  dispose() {
    this.messages = null
    this.editorElements = null
    this.panel.destroy()
    this.subscriptions.dispose()
  }
}
