/* @flow */

import { CompositeDisposable } from 'atom'
import { WORKSPACE_URI } from '../helpers'
import Delegate from './delegate'
import type { LinterMessage } from '../types'

let PanelDock

class Panel {
  panel: ?PanelDock;
  element: HTMLElement;
  delegate: Delegate;
  deactivating: boolean;
  initializing: boolean;
  subscriptions: CompositeDisposable;
  showPanelConfig: boolean;
  hidePanelWhenEmpty: boolean;
  showPanelStateMessages: boolean;
  constructor() {
    this.panel = null
    this.element = document.createElement('div')
    this.delegate = new Delegate()
    this.deactivating = false
    this.initializing = true
    this.subscriptions = new CompositeDisposable()
    this.showPanelStateMessages = false

    this.subscriptions.add(this.delegate)
    this.subscriptions.add(atom.config.observe('linter-ui-default.hidePanelWhenEmpty', (hidePanelWhenEmpty) => {
      this.hidePanelWhenEmpty = hidePanelWhenEmpty
      this.refresh()
    }))
    this.subscriptions.add(atom.workspace.addOpener((uri) => {
      if (uri === WORKSPACE_URI) {
        if (this.panel) {
          this.deactivate()
        }
        if (!PanelDock) {
          PanelDock = require('./dock')
        }
        const oldPaneItem = atom.workspace.getActivePaneItem()
        this.panel = new PanelDock(this.delegate)
        // NOTE: Atom has no API to not focus on the newly opened dock item
        setTimeout(function() {
          if (oldPaneItem && oldPaneItem.element) {
            oldPaneItem.element.focus()
          }
        }, 200)
        return this.panel
      }
      return null
    }))
    this.subscriptions.add(atom.workspace.onDidDestroyPaneItem(({ item: paneItem }) => {
      const uri = paneItem && paneItem.getURI ? paneItem.getURI() : null
      if (uri === WORKSPACE_URI && !this.deactivating) {
        atom.config.set('linter-ui-default.showPanel', false)
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', (showPanel) => {
      this.showPanelConfig = showPanel
      this.refresh()
    }))
    this.initializing = false
    this.refresh()
  }
  update(messages: Array<LinterMessage>): void {
    this.delegate.update(messages)
    this.showPanelStateMessages = !!this.delegate.filteredMessages.length
    this.refresh()
  }
  async refresh() {
    if (this.initializing) {
      return
    }
    if (
      (this.showPanelConfig) &&
      (!this.hidePanelWhenEmpty || this.showPanelStateMessages)
    ) {
      await this.activate()
    } else {
      this.deactivate()
    }
  }
  async activate() {
    if (this.panel) {
      return
    }
    await atom.workspace.open(WORKSPACE_URI)
  }
  deactivate() {
    if (!this.panel) {
      return
    }
    this.deactivating = true
    this.panel.dispose()
    this.deactivating = false
    this.panel = null
  }
  dispose() {
    this.deactivate()
    this.subscriptions.dispose()
  }
}

module.exports = Panel
