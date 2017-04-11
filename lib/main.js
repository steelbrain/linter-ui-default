/* @flow */

import { CompositeDisposable } from 'atom'
import TreeView from './tree-view'
import Commands from './commands'
import StatusBar from './status-bar'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import type { Linter, LinterMessage, MessagesPatch } from './types'

let Panel
let Editors

export default class LinterUI {
  name: string;
  panel: ?Panel;
  signal: BusySignal;
  editors: ?Editors;
  treeview: TreeView;
  commands: Commands;
  messages: Array<LinterMessage>;
  statusBar: StatusBar;
  intentions: Intentions;
  subscriptions: CompositeDisposable;
  idleCallbacks: Set<*>;

  constructor() {
    this.name = 'Linter'
    this.idleCallbacks = new Set()
    this.signal = new BusySignal()
    this.treeview = new TreeView()
    this.commands = new Commands()
    this.messages = []
    this.statusBar = new StatusBar()
    this.intentions = new Intentions()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.signal)
    this.subscriptions.add(this.treeview)
    this.subscriptions.add(this.commands)
    this.subscriptions.add(this.statusBar)

    let obsShowPanelCB
    const observeShowPanel = () => {
      this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', (showPanel) => {
        this.idleCallbacks.delete(obsShowPanelCB)
        if (!Panel) {
          Panel = require('./panel')
        }
        if (showPanel && !this.panel) {
          this.panel = new Panel()
          this.panel.update(this.messages)
        } else if (!showPanel && this.panel) {
          this.panel.dispose()
          this.panel = null
        }
      }))
    }
    obsShowPanelCB = window.requestIdleCallback(observeShowPanel)
    this.idleCallbacks.add(obsShowPanelCB)

    let obsShowDecorationsCB
    const observeShowDecorations = () => {
      this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', (showDecorations) => {
        this.idleCallbacks.delete(obsShowDecorationsCB)
        if (!Editors) {
          Editors = require('./editors')
        }
        if (showDecorations && !this.editors) {
          this.editors = new Editors()
          this.editors.update({ added: this.messages, removed: [], messages: this.messages })
        } else if (!showDecorations && this.editors) {
          this.editors.dispose()
          this.editors = null
        }
      }))
    }
    obsShowDecorationsCB = window.requestIdleCallback(observeShowDecorations)
    this.idleCallbacks.add(obsShowDecorationsCB)
  }
  render(difference: MessagesPatch) {
    const editors = this.editors

    this.messages = difference.messages
    if (editors) {
      if (editors.isFirstRender()) {
        editors.update({ added: difference.messages, removed: [], messages: difference.messages })
      } else {
        editors.update(difference)
      }
    }
    if (this.panel) {
      this.panel.update(difference.messages)
    }
    this.commands.update(difference.messages)
    this.treeview.update(difference.messages)
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
