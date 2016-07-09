/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import Panel from './panel'
import Editors from './editors'
import TreeView from './tree-view'
import Commands from './commands'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import type { Linter, Message, MessageLegacy, MessagesPatch } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
  signal: BusySignal;
  editors: Editors;
  treeview: TreeView;
  commands: Commands;
  messages: Array<Message | MessageLegacy>;
  intentions: Intentions;
  subscriptions: CompositeDisposable;
  signalRegistry: Object;

  constructor() {
    this.name = 'Linter'
    this.intentions = new Intentions()
    this.intentions.onShouldProvideEditor(event => {
      event.editor = this.editors.getEditor(event.textEditor)
    })
  }
  activate() {
    this.signal = new BusySignal()
    this.editors = new Editors()
    this.treeview = new TreeView()
    this.commands = new Commands()
    this.messages = []
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.signal)
    this.subscriptions.add(this.editors)
    this.subscriptions.add(this.treeview)
    this.subscriptions.add(this.commands)
    this.editors.onShouldRender(() => {
      if (this.panel) {
        this.panel.apply()
      }
    })
    this.commands.onShouldProvideMessages(event => {
      const editor = this.editors.getByFilePath(event.filePath)
      if (editor.length) {
        event.messages = Array.from(editor[0].messages)
      }
    })

    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', showPanel => {
      if (showPanel && !this.panel) {
        this.panel = new Panel()
        this.panel.apply(this.messages)
      } else if (!showPanel && this.panel) {
        this.panel.dispose()
        this.panel = null
      }
    }))
    if (this.signalRegistry) {
      this.signal.attach(this.signalRegistry)
    }
  }
  render(difference: MessagesPatch) {
    this.messages = difference.messages
    this.editors.apply(difference)
    if (this.panel) {
      this.panel.apply(difference.messages)
    }
    this.treeview.apply(difference)
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
