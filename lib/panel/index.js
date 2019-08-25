/* @flow */

import { CompositeDisposable } from 'atom'
import Delegate from './delegate'
import PanelDock from './dock'
import type { LinterMessage } from '../types'

class Panel {
  panel: PanelDock | null
  element: HTMLElement
  delegate: Delegate
  messages: Array<LinterMessage>
  deactivating: boolean
  subscriptions: CompositeDisposable
  showPanelConfig: boolean
  hidePanelWhenEmpty: boolean
  showPanelStateMessages: boolean
  activationTimer: number
  constructor() {
    this.panel = null
    this.element = document.createElement('div')
    this.delegate = new Delegate()
    this.messages = []
    this.deactivating = false
    this.subscriptions = new CompositeDisposable()
    this.showPanelStateMessages = false

    this.subscriptions.add(this.delegate)
    this.subscriptions.add(
      atom.config.observe('linter-ui-default.hidePanelWhenEmpty', hidePanelWhenEmpty => {
        this.hidePanelWhenEmpty = hidePanelWhenEmpty
        this.refresh()
      }),
    )
    this.subscriptions.add(
      atom.workspace.onDidDestroyPane(({ pane: destroyedPane }) => {
        const isPaneItemDestroyed = destroyedPane.getItems().includes(this.panel)
        if (isPaneItemDestroyed && !this.deactivating) {
          this.panel = null
          atom.config.set('linter-ui-default.showPanel', false)
        }
      }),
    )
    this.subscriptions.add(
      atom.workspace.onDidDestroyPaneItem(({ item: paneItem }) => {
        if (paneItem instanceof PanelDock && !this.deactivating) {
          this.panel = null
          atom.config.set('linter-ui-default.showPanel', false)
        }
      }),
    )
    this.subscriptions.add(
      atom.config.observe('linter-ui-default.showPanel', showPanel => {
        this.showPanelConfig = showPanel
        this.refresh()
      }),
    )
    this.subscriptions.add(
      atom.workspace.getCenter().observeActivePaneItem(() => {
        this.showPanelStateMessages = !!this.delegate.filteredMessages.length
        this.refresh()
      }),
    )
    this.activationTimer = window.requestIdleCallback(() => {
      const dock = atom.workspace.getBottomDock()
      this.subscriptions.add(
        dock.onDidChangeActivePaneItem(paneItem => {
          if (!this.panel || this.getPanelLocation() !== 'bottom') {
            return
          }
          const isFocusIn = paneItem === this.panel
          const externallyToggled = isFocusIn !== this.showPanelConfig
          if (externallyToggled) {
            atom.config.set('linter-ui-default.showPanel', !this.showPanelConfig)
          }
        }),
      )
      this.subscriptions.add(
        dock.onDidChangeVisible(visible => {
          if (!this.panel || this.getPanelLocation() !== 'bottom') {
            return
          }
          if (!visible) {
            // ^ When it's time to tell config to hide
            if (this.showPanelConfig && this.hidePanelWhenEmpty && !this.showPanelStateMessages) {
              // Ignore because we just don't have any messages to show, everything else is fine
              return
            }
          }
          const externallyToggled = visible !== this.showPanelConfig
          if (externallyToggled) {
            atom.config.set('linter-ui-default.showPanel', !this.showPanelConfig)
          }
        }),
      )

      this.activate()
    })
  }
  getPanelLocation() {
    if (!this.panel) {
      return null
    }
    const paneContainer = atom.workspace.paneContainerForItem(this.panel)
    return (paneContainer && paneContainer.location) || null
  }
  async activate() {
    if (this.panel) {
      return
    }
    this.panel = new PanelDock(this.delegate)
    await atom.workspace.open(this.panel, {
      activatePane: false,
      activateItem: false,
      searchAllPanes: true,
    })
    this.update()
    this.refresh()
  }
  update(newMessages: ?Array<LinterMessage> = null): void {
    if (newMessages) {
      this.messages = newMessages
    }
    this.delegate.update(this.messages)
    this.showPanelStateMessages = !!this.delegate.filteredMessages.length
    this.refresh()
  }
  async refresh() {
    const panel = this.panel
    if (panel === null) {
      if (this.showPanelConfig) {
        await this.activate()
      }
      return
    }
    const paneContainer = atom.workspace.paneContainerForItem(panel)
    if (!paneContainer || paneContainer.location !== 'bottom') {
      return
    }
    const isActivePanel = paneContainer.getActivePaneItem() === panel
    const visibilityAllowed1 = this.showPanelConfig
    const visibilityAllowed2 = this.hidePanelWhenEmpty ? this.showPanelStateMessages : true
    if (visibilityAllowed1 && visibilityAllowed2) {
      if (!isActivePanel) {
        paneContainer.paneForItem(panel).activateItem(panel)
      }
      paneContainer.show()
      panel.doPanelResize()
    } else if (isActivePanel) {
      paneContainer.hide()
    }
  }
  dispose() {
    this.deactivating = true
    if (this.panel) {
      this.panel.dispose()
    }
    this.subscriptions.dispose()
    window.cancelIdleCallback(this.activationTimer)
  }
}

module.exports = Panel
