/* @flow */

import { CompositeDisposable } from 'sb-event-kit'

import Element from './element'
import { $file } from '../helpers'
import type { LinterMessage } from '../types'

export default class StatusBar {
  element: Element;
  messages: Array<LinterMessage>;
  subscriptions: CompositeDisposable;
  statusBarRepresents: 'Entire Project' | 'Current File';
  statusBarClickBehavior: 'Toggle Panel' | 'Jump to next issue';

  constructor() {
    this.element = new Element()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.element)
    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarRepresents', (statusBarRepresents) => {
      const notInitial = typeof this.statusBarRepresents !== 'undefined'
      this.statusBarRepresents = statusBarRepresents
      if (notInitial) {
        this.update()
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarClickBehavior', (statusBarClickBehavior) => {
      const notInitial = typeof this.statusBarClickBehavior !== 'undefined'
      this.statusBarClickBehavior = statusBarClickBehavior
      if (notInitial) {
        this.update()
      }
    }))
    this.subscriptions.add(atom.config.observe('linter-ui-default.showStatusBar', (showStatusBar) => {
      this.element.setVisibility('config', showStatusBar)
    }))
    this.subscriptions.add(atom.workspace.observeActivePaneItem((paneItem) => {
      const isTextEditor = atom.workspace.isTextEditor(paneItem)
      this.element.setVisibility('pane', isTextEditor)
      if (isTextEditor && this.statusBarRepresents === 'Current File') {
        this.update()
      }
    }))

    this.element.onDidClick((type) => {
      const workspaceView = atom.views.getView(atom.workspace)
      if (this.statusBarClickBehavior === 'Toggle Panel') {
        atom.commands.dispatch(workspaceView, 'linter-ui-default:toggle-panel')
      } else {
        const postfix = this.statusBarRepresents === 'Current File' ? '-in-current-file' : ''
        atom.commands.dispatch(workspaceView, `linter-ui-default:next-${type}${postfix}`)
      }
    })
  }
  update(messages: ?Array<LinterMessage> = null): void {
    if (messages) {
      this.messages = messages
    } else {
      messages = this.messages
    }

    const count = { error: 0, warning: 0, info: 0 }
    const currentTextEditor = atom.workspace.getActiveTextEditor()
    const currentPath = (currentTextEditor && currentTextEditor.getPath()) || NaN
    // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages

    messages.forEach((message) => {
      if (this.statusBarRepresents === 'Entire Project' || $file(message) === currentPath) {
        if (message.severity === 'error') {
          count.error++
        } else if (message.severity === 'warning') {
          count.warning++
        } else {
          count.info++
        }
      }
    })
    this.element.update(count.error, count.warning, count.info)
  }
  attach(statusBarRegistry: Object) {
    let statusBar = null

    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarPosition', (statusBarPosition) => {
      if (statusBar) {
        statusBar.destroy()
      }
      statusBar = statusBarRegistry[`add${statusBarPosition}Tile`]({
        item: this.element.item,
        priority: statusBarPosition === 'Left' ? 0 : 1000,
      })
    }))
    this.subscriptions.add(function() {
      if (statusBar) {
        statusBar.destroy()
      }
    })
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
