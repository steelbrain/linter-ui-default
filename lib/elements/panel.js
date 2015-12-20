'use babel'

/** @jsx vanilla.jsx */
import {Emitter, CompositeDisposable} from 'atom'
import vanilla from 'vanilla-jsx'
import {PanelStatusElement} from './panel-status'

export const PanelIcons = {
  MIN: '🗕',
  MAX: '🗖'
}

export class PanelElement {
  constructor() {
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
        <div class="panel-heading">
          <div class="heading-title">
            Linter
          </div>
          {panelStatus.element}
          <div class="heading-icons">
            <span ref="toggleContent" title="Minimize">{PanelIcons.MIN}</span>
            <span ref="destroy" title="Hide">✖</span>
          </div>
        </div>
        <div ref="content" class="panel-body"></div>
      </div>
    </linter-ui-default-panel>)

    panel.status = panelStatus

    return panel
  }
}
