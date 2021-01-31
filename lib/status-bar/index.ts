import { CompositeDisposable, Disposable } from 'atom'
import type { StatusBar as StatusBarRegistry, Tile as StatusBarTile } from 'atom/status-bar'
import Element from './element'
import { $file, getActiveTextEditor } from '../helpers'
import type { LinterMessage } from '../types'

export default class StatusBar {
  element: Element = new Element()
  messages: Array<LinterMessage> = []
  subscriptions: CompositeDisposable = new CompositeDisposable()
  statusBarRepresents?: 'Entire Project' | 'Current File'
  statusBarClickBehavior?: 'Toggle Panel' | 'Jump to next issue' | 'Toggle Status Bar Scope'

  constructor() {
    this.subscriptions.add(
      this.element,
      atom.config.observe('linter-ui-default.statusBarRepresents', statusBarRepresents => {
        const notInitial = typeof this.statusBarRepresents !== 'undefined'
        this.statusBarRepresents = statusBarRepresents
        if (notInitial) {
          this.update()
        }
      }),
      atom.config.observe('linter-ui-default.statusBarClickBehavior', statusBarClickBehavior => {
        const notInitial = typeof this.statusBarClickBehavior !== 'undefined'
        this.statusBarClickBehavior = statusBarClickBehavior
        if (notInitial) {
          this.update()
        }
      }),
      atom.config.observe('linter-ui-default.showStatusBar', showStatusBar => {
        this.element.setVisibility('config', showStatusBar)
      }),
      atom.workspace.getCenter().observeActivePaneItem(paneItem => {
        const isTextEditor = atom.workspace.isTextEditor(paneItem)
        this.element.setVisibility('pane', isTextEditor)
        if (isTextEditor && this.statusBarRepresents === 'Current File') {
          this.update()
        }
      }),
    )

    this.element.onDidClick(type => {
      const workspaceView = atom.views.getView(atom.workspace)
      if (this.statusBarClickBehavior === 'Toggle Panel') {
        atom.commands.dispatch(workspaceView, 'linter-ui-default:toggle-panel')
      } else if (this.statusBarClickBehavior === 'Toggle Status Bar Scope') {
        atom.config.set(
          'linter-ui-default.statusBarRepresents',
          this.statusBarRepresents === 'Entire Project' ? 'Current File' : 'Entire Project',
        )
      } else {
        const postfix = this.statusBarRepresents === 'Current File' ? '-in-current-file' : ''
        atom.commands.dispatch(workspaceView, `linter-ui-default:next-${type}${postfix}`)
      }
    })
  }
  update(messages: Array<LinterMessage> | null | undefined = null): void {
    if (messages) {
      this.messages = messages
    } else {
      messages = this.messages
    }

    const count = { error: 0, warning: 0, info: 0 }
    const currentTextEditor = getActiveTextEditor()
    const currentPath = (currentTextEditor && currentTextEditor.getPath()) || NaN
    // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages

    messages.forEach(message => {
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
  attach(statusBarRegistry: StatusBarRegistry) {
    let statusBar: StatusBarTile | null = null

    this.subscriptions.add(
      atom.config.observe('linter-ui-default.statusBarPosition', statusBarPosition => {
        if (statusBar) {
          statusBar.destroy()
        }
        statusBar = statusBarRegistry[`add${statusBarPosition}Tile`]({
          item: this.element.item,
          priority: statusBarPosition === 'Left' ? 0 : 1000,
        })
      }),
    )
    this.subscriptions.add(
      new Disposable(function () {
        if (statusBar) {
          statusBar.destroy()
        }
      }),
    )
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
