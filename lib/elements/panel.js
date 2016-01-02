'use babel'

/** @jsx vanilla.jsx */
import {Emitter, CompositeDisposable} from 'atom'
import vanilla from 'vanilla-jsx'
import Interact from 'interact.js'
import {PanelStatusElement} from './panel-status'

let Clipboard

try {
  Clipboard = require('electron').clipboard
  // ^ newer versions of electron
} catch (_) {
  Clipboard = require('clipboard')
  // ^ older versions of electron
}

export const PanelIcons = {
  MIN: '🗕',
  MAX: '🗖'
}

export class PanelElement {
  constructor() {
    this.errorPanelHeight = atom.config.get('linter-ui-default.errorPanelHeight')

    this.element = PanelElement.getElement()
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()

    this.subscriptions.add(this.element.status)
    this.subscriptions.add(this.emitter)

    this.element.refs.toggleContent.addEventListener('click', () => {
      this.toggleContent()
    })
    this.element.refs.destroy.addEventListener('click', () => {
      this.destroy()
    })

    Interact(this.element).resizable({edges: {top: true}})
      .on('resizemove', event => {
        this.setHeight(event.rect.height)
      })
      .on('resizeend', event => {
        atom.config.set('linter-ui-default.panelHeight', event.target.clientHeight)
      })

    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.panelHeight', ({newValue}) => {
      this.errorPanelHeight = newValue
      this.setHeight(newValue)
    }))
  }
  setHeight(height) {
    const heightDiff = this.element.refs.heading.clientHeight
    const heightNew = height - heightDiff
    this.element.style.height = `${height}px`
    this.element.refs.content.style.height = `${heightNew}px`
    this.element.refs.content.style['max-height'] = `${heightNew}px`
  }
  toggleContent() {
    const content = this.element.refs.content
    const button = this.element.refs.toggleContent

    if (content.classList.contains('hide')) {
      // Maximize
      content.classList.remove('hide')
      button.title = 'Minimize'
      button.textContent = PanelIcons.MIN
    } else {
      // Minimize
      content.classList.add('hide')
      button.title = 'Maximize'
      button.textContent = PanelIcons.MAX
    }
  }
  get content() {
    return this.element.refs.content
  }
  set count(count) {
    this.element.status.count = count
  }
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback)
  }
  destroy() {
    this.emitter.emit('did-destroy')
    this.dispose()
  }
  dispose() {
    this.element = null
    this.subscriptions.dispose()
  }

  static getElement() {
    const panelStatus = new PanelStatusElement()

    const panel = vanilla.process(<linter-ui-default-panel tabindex="-1">
      <div class="inset-panel">
        <div ref="heading" class="panel-heading">
          <div class="heading-title">
            Linter
          </div>
          {panelStatus.element}
          <div class="heading-icons">
            <span ref="toggleContent" title="Minimize">{PanelIcons.MIN}</span>
            <span ref="destroy" title="Close Panel">✖</span>
          </div>
        </div>
        <div ref="content" class="panel-body empty"></div>
      </div>
    </linter-ui-default-panel>)

    panel.status = panelStatus

    panel.addEventListener('keydown', function(e) {
      if (e.which === 67 && e.ctrlKey) {
        Clipboard.writeText(getSelection().toString())
      }
    })

    return panel
  }
}
