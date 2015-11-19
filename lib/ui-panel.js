'use babel'
import {CompositeDisposable} from 'atom'
import {createMessage} from './helpers'
import {createPanel} from './element-panel'

export class Panel {
  constructor(visible) {
    this.subscriptions = new CompositeDisposable()
    this.element = createPanel()
    this.element.refs.hide.addEventListener('click', () => this.panel.hide())

    this.configVisibility = visible
    this.paneVisibility = true
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(paneItem => {
      this.paneVisibility = paneItem && typeof paneItem.getText === 'function'
      this.updateVisibility()
      this.updateEditorElements()
    }))
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.showIssuesFromAllFiles', () => {
      this.updateEditorElements()
    }))

    this.panel = atom.workspace.addBottomPanel({
      item: this.element,
      visible: this.configVisibility && this.paneVisibility,
      priority: 500
    })

    this.editorMessages = new WeakMap()
    this.editorElements = new Map()
    this.countElements = new Map()

    this.getEditorElement(null)
    // ^- Initialize element for no-file-path messages
    this.getCountElement('Error')
    this.getCountElement('Warning')
    // ^- Make sure these tabs are first of all
  }

  getCountElement(name) {
    if (this.countElements.has(name)) {
      return this.countElements.get(name)
    }
    const el = document.createElement('span')
    el.textContent = `${name}s: 0`
    el.setCount = function(count) {
      this.textContent = `${name}s: ${count}`
    }
    this.element.refs.counts.appendChild(el)
    this.countElements.set(name, el)
    return el
  }
  getEditorElement(path) {
    if (this.editorElements.has(path)) {
      return this.editorElements.get(path)
    }
    const el = document.createElement('div')
    el.setAttribute('hidden', true)
    el.countMap = {}
    this.element.refs.content.appendChild(el)
    this.editorElements.set(path, el)
    return el
  }
  updateEditorElements() {

    const showAll = atom.config.get('linter-ui-default.showIssuesFromAllFiles')
    const activeEditor = atom.workspace.getActiveTextEditor()
    const activePath = activeEditor ? activeEditor.getPath() || NaN : NaN
    const countMap = {}

    let showContent = false
    let countTotal = 0

    this.editorElements.forEach((element, key) => {
      if (key === null) {
        return
      }
      if (!element.children.length) {
        element.remove()
        return this.editorElements.delete(key)
      }
      if (!showAll && key !== activePath) {
        return element.setAttribute('hidden', true)
      }
      showContent = true
      element.removeAttribute('hidden')
      for (let type in element.countMap) {
        if (countMap[type]) {
          countMap[type] += element.countMap[type]
        } else countMap[type] = element.countMap[type]
      }
    })
    if (showContent || this.editorElements.get(null).children.length) {
      this.element.refs.content.classList.remove('hide')
    } else {
      this.element.refs.content.classList.add('hide')
    }

    for (let type in countMap) {
      this.getCountElement(type).setCount(countMap[type])
      countTotal += countMap[type]
    }

    this.countElements.forEach(function(element, type, countElements) {
      if (!countMap[type]) {
        if (type !== 'Error' && type !== 'Warning' ) {
          countElements.delete(type)
          element.remove()
        } else {
          element.setCount(0)
        }
      }
    })

    this.element.refs.status.setCount(countTotal)
  }

  addMessage(message) {
    const messageElement = createMessage(message)
    const editorElement = this.getEditorElement(message.filePath)
    this.editorMessages.set(message, messageElement)
    editorElement.appendChild(messageElement)

    if (editorElement.countMap[message.type]) {
      editorElement.countMap[message.type]++
    } else {
      editorElement.countMap[message.type] = 1
    }
  }
  removeMessage(message) {
    const messageElement = this.editorMessages.get(message)
    messageElement.parentNode.countMap[message.type]--
    messageElement.remove()
  }

  set visibility(visibility) {
    this.configVisibility = visibility
    this.updateVisibility()
  }

  updateVisibility() {
    if (this.configVisibility && this.paneVisibility) {
      this.panel.show()
    } else {
      this.panel.hide()
    }
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
