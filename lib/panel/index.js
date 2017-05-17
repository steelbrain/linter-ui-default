/* @flow */

import { CompositeDisposable } from 'atom'
import { WORKSPACE_URI } from '../helpers'
import Delegate from './delegate'
import PanelDock from './dock'
import type { LinterMessage } from '../types'

class Panel {
  panel: ?PanelDock;
  element: HTMLElement;
  delegate: Delegate;
  subscriptions: CompositeDisposable;
  showPanelConfig: boolean;
  hidePanelWhenEmpty: boolean;
  showPanelStateMessages: boolean;
  constructor() {
    this.element = document.createElement('div')
    this.delegate = new Delegate()
    this.panel = new PanelDock(this.delegate)
    this.subscriptions = new CompositeDisposable()
    this.showPanelStateMessages = false

    this.subscriptions.add(this.delegate)
    this.subscriptions.add(this.panel)
    this.subscriptions.add(atom.config.observe('linter-ui-default.hidePanelWhenEmpty', (hidePanelWhenEmpty) => {
      this.hidePanelWhenEmpty = hidePanelWhenEmpty
      this.refresh()
    }))
    this.subscriptions.add(atom.workspace.addOpener((uri) => {
      if (uri === WORKSPACE_URI) {
        return this.panel
      }
      return null
    }))
    this.subscriptions.add(atom.workspace.onDidDestroyPaneItem(({ item: paneItem }) => {
      if (paneItem instanceof PanelDock) {
        this.panel = null
        atom.config.set('linter-ui-default.showPanel', false)
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', (showPanel) => {
      this.showPanelConfig = showPanel
      this.refresh()
    }))
    this.activate()
  }
  async activate() {
    await atom.workspace.open(WORKSPACE_URI, {
      activatePane: false,
      activateItem: false,
      searchAllPanes: true,
    })
  }
  update(messages: Array<LinterMessage>): void {
    this.delegate.update(messages)
    this.showPanelStateMessages = !!this.delegate.filteredMessages.length
    this.refresh()
  }
  async refresh() {
    if (this.panel === null) {
      if (this.showPanelConfig) {
        await this.activate()
      } else return
    }
    const paneContainer = atom.workspace.paneContainerForItem(this.panel)
    if (!paneContainer && paneContainer === 'bottom') {
      return
    }
    if (
      (this.showPanelConfig) &&
      (!this.hidePanelWhenEmpty || this.showPanelStateMessages)
    ) {
      paneContainer.show()
    } else {
      paneContainer.hide()
    }
  }
  dispose() {
    this.subscriptions.dispose()
  }
}

module.exports = Panel
