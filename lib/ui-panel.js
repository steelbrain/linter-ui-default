'use babel'
/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {CompositeDisposable} from 'atom'
import {createMessage} from './helpers'
import Clipboard from 'clipboard'
// TODO: ^- when atom updates to a never version of Electron, change this to `require('electron').Clipboard`

export class Panel {
  constructor(visible) {
    this.subscriptions = new CompositeDisposable()
    this.element = this.createElement()

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
      visible: this.visibility,
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
      if (key !== null) {
        if (!element.children.length) {
          element.remove()
          this.editorElements.delete(key)
        } else {
          if (showAll || key === activePath) {
            showContent = true
            element.removeAttribute('hidden')
            for (let type in element.countMap) {
              if (countMap[type]) {
                countMap[type] += element.countMap[type]
              } else countMap[type] = element.countMap[type]
            }
          } else {
            element.setAttribute('hidden', true)
          }
        }
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

    this.countElements.forEach((element, type) => {
      if (!countMap[type]) {
        if (type !== 'Error' && type !== 'Warning' ) {
          this.countElements.delete(type)
          element.remove()
        } else {
          this.countElements.get(type).setCount(0)
        }
      }
    })

    this.element.refs.status.setCount(countTotal)
  }

  update({added, removed}) {
    if (added.length)
    added.forEach(message => {
      const messageElement = createMessage(message)
      const editorElement = this.getEditorElement(message.filePath)
      this.editorMessages.set(message, messageElement)
      editorElement.appendChild(messageElement)

      if (editorElement.countMap[message.type]) {
        editorElement.countMap[message.type]++
      } else {
        editorElement.countMap[message.type] = 1
      }
    })

    if(removed.length)
    removed.forEach(message => {
      const messageElement = this.editorMessages.get(message)
      messageElement.parentNode.countMap[message.type]--
      messageElement.remove()
    })

    this.updateEditorElements()
  }

  createElement() {
    const icons = {
      MIN: '🗕',
      MAX: '🗖'
    }
    let content

    const hidePanel = () => this.panel.hide()
    const toggleContent = function() {
      if (content.classList.contains('hidden')) {
        this.textContent = icons.MIN
        content.classList.remove('hidden')
      } else {
        this.textContent = icons.MAX
        content.classList.add('hidden')
      }
    }
    const setCount = function(count) {
      if (count) {
        this.classList.remove('status-success')
        this.classList.add('status-error')
        this.childNodes[0].classList.remove('icon-check')
        this.childNodes[0].classList.add('icon-x')

        this.childNodes[1].textContent = count === 1 ? '1 Issue' : `${count} Issues`
      } else {
        this.classList.remove('status-error')
        this.classList.add('status-success')
        this.childNodes[0].classList.remove('icon-x')
        this.childNodes[0].classList.add('icon-check')

        this.childNodes[1].textContent = 'No Issues'
      }
    }

    const el = <linter-new-panel tabindex="-1">
      <div class="inset-panel">
        <div class="panel-heading">
          <div class="heading-title">
            Linter
          </div>
          <div class="heading-status">
            <linter-bottom-status class="status-success">
              <span class="icon icon-check"></span> No Issues
            </linter-bottom-status>
          </div>
          <div class="heading-icons">
            <span onclick={toggleContent}>{icons.MIN}</span>
            <span onclick={hidePanel}>✖</span>
          </div>
        </div>
        <div class="panel-body hide"></div>
      </div>
    </linter-new-panel>

    el.refs = {}
    content = el.refs.content = el.querySelector('.panel-body')
    el.refs.counts = el.querySelector('.heading-status')
    el.refs.status = el.querySelector('linter-bottom-status')

    el.addEventListener('keydown', function(e) {
      if (e.which == 67 && e.ctrlKey) {
        Clipboard.writeText(getSelection().toString())
      }
    })
    el.refs.status.setCount = setCount

    return el
  }

  get visibility() {
    return this.configVisibility && this.paneVisibility
  }

  set visibility(visibility) {
    this.configVisibility = visibility
    this.updateVisibility()
  }

  updateVisibility() {
    if (this.visibility) {
      this.panel.show()
    } else {
      this.panel.hide()
    }
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
