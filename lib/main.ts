import { CompositeDisposable } from 'atom'
const { config } = atom
import Panel from './panel'
import Commands from './commands'
import StatusBar from './status-bar'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import type { Linter, LinterMessage, MessagesPatch } from './types'

import Editors from './editors'
import TreeView from './tree-view'

export default class LinterUI {
  name: string = 'Linter'
  panel?: Panel
  signal: BusySignal = new BusySignal()
  editors: Editors | null | undefined
  treeview?: TreeView
  commands: Commands = new Commands()
  messages: Array<LinterMessage> = []
  statusBar: StatusBar = new StatusBar()
  intentions: Intentions = new Intentions()
  subscriptions: CompositeDisposable = new CompositeDisposable()
  idleCallbacks: Set<number> = new Set()

  constructor() {
    this.subscriptions.add(this.signal, this.commands, this.statusBar)

    const obsShowPanelCB = window.requestIdleCallback(
      /* observeShowPanel */ async () => {
        this.idleCallbacks.delete(obsShowPanelCB)
        this.panel = new Panel()
        await this.panel.update(this.messages)
      },
    )
    this.idleCallbacks.add(obsShowPanelCB)

    const obsShowDecorationsCB = window.requestIdleCallback(
      /* observeShowDecorations */ () => {
        this.idleCallbacks.delete(obsShowDecorationsCB)
        this.subscriptions.add(
          config.observe('linter-ui-default.showDecorations', (showDecorations: boolean) => {
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
      },
    )
    this.idleCallbacks.add(obsShowDecorationsCB)
  }

  async render(difference: MessagesPatch) {
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
      this.treeview = new TreeView()
      this.subscriptions.add(this.treeview)
    }
    this.treeview.update(difference.messages)

    if (this.panel) {
      await this.panel.update(difference.messages)
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
