'use babel'
/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {CompositeDisposable} from 'atom'

export class Panel {
  constructor(visible) {
    this.subscriptions = new CompositeDisposable()
    this.element = this.createElement()

    this.configVisibility = visible
    this.paneVisibility = true
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(paneItem => {
      this.paneVisibility = paneItem && typeof paneItem.getText === 'function'
      this.updateVisibility()
    }))

    this.panel = atom.workspace.addBottomPanel({
      item: this.element,
      visible: this.visibility,
      priority: 500
    })
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

    const el = <linter-new-panel tabindex="-1">
      <div class="header">
        <div class="header-icons">
          <span class="header-icon" onclick={toggleContent}>{icons.MIN}</span>
          <span class="header-icon" onclick={hidePanel}>✖</span>
        </div>
      </div>
      <div class="content empty"></div>
    </linter-new-panel>

    el.refs = {}
    content = el.refs.content = el.children[1]

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
    const visibility = this.visibility
    if (visibility) {
      this.panel.show()
    } else {
      this.panel.hide()
    }
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
