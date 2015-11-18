'use babel'
/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {CompositeDisposable} from 'atom'

export class Panel {
  constructor(visible) {
    this.subscriptions = new CompositeDisposable()
    this.element = this.createElement()
    this.panel = atom.workspace.addBottomPanel({
      item: this.element,
      visible: visible,
      priority: 500
    })
  }

  dispose() {
    this.subscriptions.dispose()
  }

  createElement() {
    const hidePanel = () => this.panel.hide()

    const el = <linter-new-panel tabindex="-1">
      <div class="header">
        <span class="header-close" onclick={hidePanel}>✖</span>
      </div>
      <div class="content empty">
        Greetings, I am the new linter panel
      </div>
    </linter-new-panel>
    el.refs = {}
    el.refs.content = el.children[1]

    return el
  }
}
