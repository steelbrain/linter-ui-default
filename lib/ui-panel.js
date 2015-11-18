'use babel'
/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import {CompositeDisposable} from 'atom'

export class Panel {
  constructor(visible) {
    this.subscriptions = new CompositeDisposable()
    this.element = Panel.createElement()
    this.panel = atom.workspace.addBottomPanel({
      item: this.element,
      visible: visible,
      priority: 500
    })
  }

  dispose() {
    this.subscriptions.dispose()
  }

  static createElement() {
    return <linter-new-panel>
      Greetings, I am the new linter panel
    </linter-new-panel>
  }
}
