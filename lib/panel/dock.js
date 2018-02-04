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
  if (paneContainer && typeof paneContainer.state === 'object' && typeof paneContainer.state.size === 'number' && typeof paneContainer.render === 'function') {
    return paneContainer
  }
  return null
}

class PanelDock {
  element: HTMLElement;
  subscriptions: CompositeDisposable;

  constructor(delegate: Object) {
    this.element = document.createElement('div')
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelHeight', (panelHeight) => {
      const paneContainer = getPaneContainer(this)
      if (paneContainer) {
        paneContainer.state.size = panelHeight
        paneContainer.render(paneContainer.state)
      }
    }))

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
    if (paneContainer) {
      atom.config.set('linter-ui-default.panelHeight', paneContainer.state.size)
      paneContainer.paneForItem(this).destroyItem(this, true)
    }
  }
}

module.exports = PanelDock
