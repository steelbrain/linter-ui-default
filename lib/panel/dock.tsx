import { CompositeDisposable, Dock, WorkspaceCenter } from 'atom'
const { config, workspace, views } = atom
import { WORKSPACE_URI, DOCK_ALLOWED_LOCATIONS, DOCK_DEFAULT_LOCATION } from '../helpers'
import type Delegate from './delegate'
import { render } from 'solid-js/web'

// NOTE: these were lazy
import { PanelComponent } from './component'

// TODO Make these API public
export type PaneContainer = Dock & {
  state: { size: number }
  render: Function
  paneForItem: WorkspaceCenter['paneForItem']
  location: string
}

// eslint-disable-next-line no-use-before-define
function getPaneContainer(item: PanelDock): PaneContainer | null {
  const paneContainer = workspace.paneContainerForItem(item)
  // NOTE: This is an internal API access
  // It's necessary because there's no Public API for it yet
  if (
    paneContainer &&
    // @ts-ignore internal API
    typeof paneContainer.state === 'object' &&
    // @ts-ignore internal API
    typeof paneContainer.state.size === 'number' &&
    // @ts-ignore internal API
    typeof paneContainer.render === 'function'
  ) {
    // @ts-ignore internal API
    return paneContainer as PaneContainer
  }
  return null
}

export default class PanelDock {
  element: HTMLElement = document.createElement('div')
  subscriptions: CompositeDisposable = new CompositeDisposable()
  panelHeight: number = 100
  alwaysTakeMinimumSpace: boolean = true
  lastSetPaneHeight?: number

  constructor(delegate: Delegate) {
    this.subscriptions.add(
      config.observe('linter-ui-default.panelHeight', panelHeight => {
        const changed = typeof this.panelHeight === 'number'
        this.panelHeight = panelHeight
        if (changed) {
          this.doPanelResize(true)
        }
      }),
      config.observe('linter-ui-default.alwaysTakeMinimumSpace', alwaysTakeMinimumSpace => {
        this.alwaysTakeMinimumSpace = alwaysTakeMinimumSpace
      }),
    )
    this.doPanelResize()
    render(() => <PanelComponent delegate={delegate} />, this.element)
  }
  // NOTE: Chose a name that won't conflict with Dock APIs
  doPanelResize(forConfigHeight = false) {
    const paneContainer = getPaneContainer(this)
    if (paneContainer === null) {
      return
    }
    let minimumHeight: number | null = null

    const paneContainerView = views.getView(paneContainer)
    if (paneContainerView && this.alwaysTakeMinimumSpace) {
      // NOTE: Super horrible hack but the only possible way I could find :((
      const dockNamesElement = paneContainerView.querySelector('.list-inline.tab-bar.inset-panel')
      const dockNamesRects = dockNamesElement ? dockNamesElement.getClientRects()[0] : null
      const tableElement = this.element.querySelector('table')
      const panelRects = tableElement ? tableElement.getClientRects()[0] : null
      if (dockNamesRects && panelRects) {
        minimumHeight = dockNamesRects.height + panelRects.height + 1
      }
    }

    let updateConfigHeight: number | null = null
    const heightSet =
      minimumHeight !== null && !forConfigHeight ? Math.min(minimumHeight, this.panelHeight) : this.panelHeight

    // Person resized the panel, save new resized value to config
    if (this.lastSetPaneHeight !== undefined && paneContainer.state.size !== this.lastSetPaneHeight && !forConfigHeight) {
      updateConfigHeight = paneContainer.state.size
    }

    this.lastSetPaneHeight = heightSet
    paneContainer.state.size = heightSet
    paneContainer.render(paneContainer.state)

    if (updateConfigHeight !== null) {
      config.set('linter-ui-default.panelHeight', updateConfigHeight)
    }
  }

  /* eslint-disable class-methods-use-this */
  // atom API requires these methods
  getURI() {
    return WORKSPACE_URI
  }
  getTitle() {
    return 'Linter'
  }
  getDefaultLocation() {
    return DOCK_DEFAULT_LOCATION
  }
  getAllowedLocations() {
    return DOCK_ALLOWED_LOCATIONS
  }
  getPreferredHeight() {
    return config.get('linter-ui-default.panelHeight')
  }
  /* eslint-enable class-methods-use-this */

  dispose() {
    this.subscriptions.dispose()
    const paneContainer = getPaneContainer(this)
    if (paneContainer !== null && !this.alwaysTakeMinimumSpace && paneContainer.state.size !== this.panelHeight) {
      config.set('linter-ui-default.panelHeight', paneContainer.state.size)
      paneContainer.paneForItem(this)?.destroyItem(this, true)
    }
  }
}
