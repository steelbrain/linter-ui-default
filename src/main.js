/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import Panel from './panel'
import Editors from './editors'
import TreeView from './tree-view'
import Commands from './commands'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import { normalizeMessages } from './helpers'
import type { Linter, LinterMessage, MessagesPatch } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
  signal: BusySignal;
  editors: Editors;
  treeview: TreeView;
  commands: Commands;
  messages: Array<LinterMessage>;
  firstRender: boolean;
  intentions: Intentions;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.signal = new BusySignal()
    this.editors = new Editors()
    this.treeview = new TreeView()
    this.commands = new Commands()
    this.messages = []
    this.intentions = new Intentions()
    this.firstRender = true
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.signal)
    this.subscriptions.add(this.editors)
    this.subscriptions.add(this.treeview)
    this.subscriptions.add(this.commands)
    this.commands.onShouldProvideMessages((event) => {
      const editor = this.editors.getByFilePath(event.filePath)
      if (editor.length) {
        event.messages = Array.from(editor[0].messages)
      }
    })
    this.intentions.onShouldProvideEditor((event) => {
      event.editor = this.editors.getEditor(event.textEditor)
    })

    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', (showPanel) => {
      if (showPanel && !this.panel) {
        this.panel = new Panel()
        this.panel.update(this.messages)
      } else if (!showPanel && this.panel) {
        this.panel.dispose()
        this.panel = null
      }
    }))
  }
  render(difference: MessagesPatch) {
    this.messages = difference.messages
    if (this.firstRender) {
      normalizeMessages(difference.messages)
      this.firstRender = false
    } else {
      normalizeMessages(difference.added)
    }
    this.editors.update(difference)
    if (this.panel) {
      this.panel.update(difference.messages)
    }
    this.treeview.update(difference.messages)
  }
  didBeginLinting(linter: Linter, filePath: string) {
    this.signal.didBeginLinting(linter, filePath)
  }
  didFinishLinting(linter: Linter, filePath: string) {
    this.signal.didFinishLinting(linter, filePath)
  }
  dispose() {
    this.subscriptions.dispose()
    if (this.panel) {
      this.panel.dispose()
    }
  }
}
