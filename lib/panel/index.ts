import { CompositeDisposable } from 'atom'
const { config, workspace } = atom
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
  initialized: boolean = false
  constructor() {
    this.subscriptions.add(
      this.delegate,
      config.observe('linter-ui-default.hidePanelWhenEmpty', async (hidePanelWhenEmpty: boolean) => {
        this.hidePanelWhenEmpty = hidePanelWhenEmpty
        await this.refresh()
      }),
      workspace.onDidDestroyPane(({ pane: destroyedPane }) => {
        const isPaneItemDestroyed = this.panel !== null ? destroyedPane.getItems().includes(this.panel) : true
        if (isPaneItemDestroyed && !this.deactivating) {
          this.panel = null
          config.set('linter-ui-default.showPanel', false)
        }
      }),
      workspace.onDidDestroyPaneItem(({ item: paneItem }) => {
        if (paneItem instanceof PanelDock && !this.deactivating) {
          this.panel = null
          config.set('linter-ui-default.showPanel', false)
        }
      }),
      config.observe('linter-ui-default.showPanel', async (showPanel: boolean) => {
        this.showPanelConfig = showPanel
        await this.refresh()
      }),
      workspace.getCenter().observeActivePaneItem(async () => {
        this.showPanelStateMessages = Boolean(this.delegate.filteredMessages.length)
        await this.refresh()
      }),
    )
    this.activationTimer = window.requestIdleCallback(async () => {
      let firstTime = true
      const dock = workspace.getBottomDock()
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
            config.set('linter-ui-default.showPanel', !this.showPanelConfig)
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
            config.set('linter-ui-default.showPanel', !this.showPanelConfig)
          }
        }),
      )

      if (config.get('linter-ui-default.createPanelOnStart') as boolean) {
        await this.activate()
      }

      this.initialized = true
    })
  }

  private getPanelLocation() {
    if (!this.panel) {
      return null
    }
    // @ts-ignore internal API
    const paneContainer: PaneContainer | undefined = workspace.paneContainerForItem(this.panel)
    return paneContainer?.location
  }

  async activate() {
    if (this.panel) {
      return
    }
    this.panel = new PanelDock(this.delegate)
    await workspace.open(this.panel, {
      activatePane: false,
      activateItem: false,
      searchAllPanes: true,
    })
    await this.update()
    await this.refresh()
  }

  async update(newMessages: Array<LinterMessage> | null | undefined = null) {
    if (newMessages) {
      this.messages = newMessages
    }
    this.delegate.update(this.messages)
    this.showPanelStateMessages = Boolean(this.delegate.filteredMessages.length)
    await this.refresh()
  }

  async refresh() {
    if (!this.initialized) {
      return
    }
    const panel = this.panel
    if (panel === null) {
      if (this.showPanelConfig) {
        await this.activate()
      }
      return
    }
    // @ts-ignore internal API
    const paneContainer: PaneContainer | undefined = workspace.paneContainerForItem(panel)
    if (paneContainer?.location !== 'bottom') {
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
