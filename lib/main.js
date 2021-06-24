/* @flow */

import { CompositeDisposable } from 'atom'
import Panel from './panel'
import Commands from './commands'
import StatusBar from './status-bar'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import type { Linter, LinterMessage, MessagesPatch } from './types'

let Editors
let TreeView

class LinterUI {
  name: string
  panel: Panel
  signal: BusySignal
  editors: ?Editors
  treeview: TreeView
  commands: Commands
  messages: Array<LinterMessage>
  statusBar: StatusBar
  intentions: Intentions
  subscriptions: CompositeDisposable
  idleCallbacks: Set<number>

  constructor() {
    this.name = 'Linter'
    this.idleCallbacks = new Set()
    this.signal = new BusySignal()
    this.commands = new Commands()
    this.messages = []
    this.statusBar = new StatusBar()
    this.intentions = new Intentions()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.signal)
    this.subscriptions.add(this.commands)
    this.subscriptions.add(this.statusBar)

    const obsShowPanelCB = window.requestIdleCallback(
      function observeShowPanel() {
        this.idleCallbacks.delete(obsShowPanelCB)
        this.panel = new Panel()
        this.panel.update(this.messages)
      }.bind(this),
    )
    this.idleCallbacks.add(obsShowPanelCB)

    const obsShowDecorationsCB = window.requestIdleCallback(
      function observeShowDecorations() {
        this.idleCallbacks.delete(obsShowDecorationsCB)
        if (!Editors) {
          Editors = require('./editors')
        }
        this.subscriptions.add(
          atom.config.observe('linter-ui-default.showDecorations', showDecorations => {
            if (showDecorations && !this.editors) {
              this.editors = new Editors()
              this.editors.update({
                added: this.messages,
                removed: [],
                messages: this.messages,
              })
            } else if (!showDecorations && this.editors) {
              this.editors.dispose()
              this.editors = null
            }
          }),
        )
      }.bind(this),
    )
    this.idleCallbacks.add(obsShowDecorationsCB)
  }
  render(difference: MessagesPatch) {
    const editors = this.editors

    this.messages = difference.messages
    if (editors) {
      if (editors.isFirstRender()) {
        editors.update({
          added: difference.messages,
          removed: [],
          messages: difference.messages,
        })
      } else {
        editors.update(difference)
      }
    }
    // Initialize the TreeView subscription if necessary
    if (!this.treeview) {
      if (!TreeView) {
        TreeView = require('./tree-view')
      }
      this.treeview = new TreeView()
      this.subscriptions.add(this.treeview)
    }
    this.treeview.update(difference.messages)

    if (this.panel) {
      this.panel.update(difference.messages)
    }
    this.commands.update(difference.messages)
    this.intentions.update(difference.messages)
    this.statusBar.update(difference.messages)
  }
  didBeginLinting(linter: Linter, filePath: string) {
    this.signal.didBeginLinting(linter, filePath)
  }
  didFinishLinting(linter: Linter, filePath: string) {
    this.signal.didFinishLinting(linter, filePath)
  }
  dispose() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID))
    this.idleCallbacks.clear()
    this.subscriptions.dispose()
    if (this.panel) {
      this.panel.dispose()
    }
    if (this.editors) {
      this.editors.dispose()
    }
  }
}

module.exports = LinterUI
