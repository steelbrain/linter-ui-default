'use babel'

import {Emitter, CompositeDisposable} from 'atom'
import {PanelElement} from './elements/panel'

export class Panel {
  constructor() {
    this.element = new PanelElement()
    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.visibility = true
    this.panel = atom.workspace.addBottomPanel({
      item: this.element.element,
      visible: this.visibility,
      priority: 500
    })

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
    }))
  }
  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback)
  }
  destroy() {
    this.emitter.emit('did-destroy')
    this.dispose()
  }
  dispose() {
    this.panel.destroy()
    this.subscriptions.dispose()
  }
}
