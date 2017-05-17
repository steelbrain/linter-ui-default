/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { CompositeDisposable } from 'atom'

import Component from './component'
import { WORKSPACE_URI } from '../helpers'

class PanelDock {
  element: HTMLElement;
  subscriptions: CompositeDisposable;

  constructor(delegate: Object) {
    this.element = document.createElement('div')
    this.subscriptions = new CompositeDisposable()
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
    const parentElement = this.element.parentElement
    if (parentElement) {
      const { height } = parentElement.getBoundingClientRect()
      if (height > 0) {
        atom.config.set('linter-ui-default.panelHeight', height)
      }
    }

    this.subscriptions.dispose()
    const paneContainer = atom.workspace.paneContainerForItem(this)
    if (paneContainer) {
      paneContainer.paneForItem(this).destroyItem(this, true)
    }
  }
}

module.exports = PanelDock
