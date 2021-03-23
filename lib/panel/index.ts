import { CompositeDisposable } from 'atom'
import Delegate from './delegate'
import PanelDock from './dock'
import type { LinterMessage } from '../types'
import type { PaneContainer } from './dock'

export default class Panel {
  panel: PanelDock | null = null
  element: HTMLElement = document.createElement('div')
  delegate: Delegate = new Delegate()
  messages: Array<LinterMessage> = []
  deactivating: boolean = false
  subscriptions: CompositeDisposable = new CompositeDisposable()
  showPanelConfig: boolean = true
  hidePanelWhenEmpty: boolean = true
  showPanelStateMessages: boolean = false
  activationTimer: number
  constructor() {
    this.subscriptions.add(
      this.delegate,
      atom.config.observe('linter-ui-default.hidePanelWhenEmpty', hidePanelWhenEmpty => {
        this.hidePanelWhenEmpty = hidePanelWhenEmpty
        this.refresh()
      }),
      atom.workspace.onDidDestroyPane(({ pane: destroyedPane }) => {
        const isPaneItemDestroyed = this.panel !== null ? destroyedPane.getItems().includes(this.panel) : true
        if (isPaneItemDestroyed && !this.deactivating) {
          this.panel = null
          atom.config.set('linter-ui-default.showPanel', false)
        }
      }),
      atom.workspace.onDidDestroyPaneItem(({ item: paneItem }) => {
        if (paneItem instanceof PanelDock && !this.deactivating) {
          this.panel = null
          atom.config.set('linter-ui-default.showPanel', false)
        }
      }),
      atom.config.observe('linter-ui-default.showPanel', showPanel => {
        this.showPanelConfig = showPanel
        this.refresh()
      }),
      atom.workspace.getCenter().observeActivePaneItem(() => {
        this.showPanelStateMessages = Boolean(this.delegate.filteredMessages.length)
        this.refresh()
      }),
    )
    this.activationTimer = window.requestIdleCallback(() => {
      let firstTime = true
      const dock = atom.workspace.getBottomDock()
      this.subscriptions.add(
        dock.onDidChangeActivePaneItem(paneItem => {
          if (!this.panel || this.getPanelLocation() !== 'bottom') {
            return
          }
          if (firstTime) {
            firstTime = false
            return
          }
          const isFocusIn = paneItem === this.panel
          const externallyToggled = isFocusIn !== this.showPanelConfig
          if (externallyToggled) {
            atom.config.set('linter-ui-default.showPanel', !this.showPanelConfig)
          }
        }),
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
          if (dock.getActivePaneItem() !== this.panel) {
            // Ignore since the visibility of this panel is not changing
            return
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
    // @ts-ignore internal API
    const paneContainer: PaneContainer = atom.workspace.paneContainerForItem(this.panel)
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
  update(newMessages: Array<LinterMessage> | null | undefined = null): void {
    if (newMessages) {
      this.messages = newMessages
    }
    this.delegate.update(this.messages)
    this.showPanelStateMessages = Boolean(this.delegate.filteredMessages.length)
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
    // @ts-ignore internal API
    const paneContainer: PaneContainer = atom.workspace.paneContainerForItem(panel)
    if (!paneContainer || paneContainer.location !== 'bottom') {
      return
    }
    const isActivePanel = paneContainer.getActivePaneItem() === panel
    const visibilityAllowed1 = this.showPanelConfig
    const visibilityAllowed2 = this.hidePanelWhenEmpty ? this.showPanelStateMessages : true
    if (visibilityAllowed1 && visibilityAllowed2) {
      if (!isActivePanel) {
        paneContainer.paneForItem(panel)?.activateItem(panel)
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
