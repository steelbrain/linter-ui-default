/* @flow */

import { CompositeDisposable } from 'atom'
import { WORKSPACE_URI } from '../helpers'

let React
let ReactDOM
let Component

// eslint-disable-next-line no-use-before-define
function getPaneContainer(item: PanelDock) {
  const paneContainer = atom.workspace.paneContainerForItem(item)
  // NOTE: This is an internal API access
  // It's necessary because there's no Public API for it yet
  if (
    paneContainer &&
    typeof paneContainer.state === 'object' &&
    typeof paneContainer.state.size === 'number' &&
    typeof paneContainer.render === 'function'
  ) {
    return paneContainer
  }
  return null
}

class PanelDock {
  element: HTMLElement
  subscriptions: CompositeDisposable
  panelHeight: number
  alwaysTakeMinimumSpace: boolean
  lastSetPaneHeight: number | null

  constructor(delegate: Object) {
    this.element = document.createElement('div')
    this.subscriptions = new CompositeDisposable()

    this.lastSetPaneHeight = null
    this.subscriptions.add(
      atom.config.observe('linter-ui-default.panelHeight', panelHeight => {
        const changed = typeof this.panelHeight === 'number'
        this.panelHeight = panelHeight
        if (changed) {
          this.doPanelResize(true)
        }
      }),
    )
    this.subscriptions.add(
      atom.config.observe('linter-ui-default.alwaysTakeMinimumSpace', alwaysTakeMinimumSpace => {
        this.alwaysTakeMinimumSpace = alwaysTakeMinimumSpace
      }),
    )
    this.doPanelResize()

    if (!React) {
      React = require('react')
    }
    if (!ReactDOM) {
      ReactDOM = require('react-dom')
    }
    if (!Component) {
      Component = require('./component')
    }

    ReactDOM.render(<Component delegate={delegate} />, this.element)
  }
  // NOTE: Chose a name that won't conflict with Dock APIs
  doPanelResize(forConfigHeight: boolean = false) {
    const paneContainer = getPaneContainer(this)
    let minimumHeight: number | null = null
    const paneContainerView = atom.views.getView(paneContainer)
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

    if (paneContainer) {
      let updateConfigHeight: number | null = null
      const heightSet =
        minimumHeight !== null && !forConfigHeight ? Math.min(minimumHeight, this.panelHeight) : this.panelHeight

      // Person resized the panel, save new resized value to config
      if (this.lastSetPaneHeight !== null && paneContainer.state.size !== this.lastSetPaneHeight && !forConfigHeight) {
        updateConfigHeight = paneContainer.state.size
      }

      this.lastSetPaneHeight = heightSet
      paneContainer.state.size = heightSet
      paneContainer.render(paneContainer.state)

      if (updateConfigHeight !== null) {
        atom.config.set('linter-ui-default.panelHeight', updateConfigHeight)
      }
    }
  }
  getURI() {
    return WORKSPACE_URI
  }
  getTitle() {
    return 'Linter'
  }
  getDefaultLocation() {
    return 'bottom'
  }
  getAllowedLocations() {
    return ['center', 'bottom', 'top']
  }
  getPreferredHeight() {
    return atom.config.get('linter-ui-default.panelHeight')
  }
  dispose() {
    this.subscriptions.dispose()
    const paneContainer = getPaneContainer(this)
    if (paneContainer && !this.alwaysTakeMinimumSpace && paneContainer.state.size !== this.panelHeight) {
      atom.config.set('linter-ui-default.panelHeight', paneContainer.state.size)
      paneContainer.paneForItem(this).destroyItem(this, true)
    }
  }
}

module.exports = PanelDock
