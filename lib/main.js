'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Panel from './panel'
import Editors from './editors'
import Commands from './commands'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import type { Linter$Linter, Linter$Difference } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
  active: boolean;
  signal: BusySignal;
  editors: Editors;
  commands: Commands;
  intentions: Intentions;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.signal = new BusySignal()
    this.intentions = new Intentions()
    this.initialize()

    this.intentions.onShouldProvideEditor(event => {
      event.editor = this.editors.getEditor(event.textEditor)
    })
  }
  initialize() {
    this.active = true
    this.editors = new Editors()
    this.commands = new Commands()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.editors)
    this.subscriptions.add(this.commands)
    this.commands.onShouldProvideMessages(event => {
      const editor = this.editors.getByFilePath(event.filePath)
      if (editor.length) {
        event.messages = Array.from(editor[0].messages)
      }
    })
  }
  activate() {
    if (!this.active) {
      this.initialize()
    }
    this.editors.activate()
    if (atom.config.get('linter-ui-default.showPanel')) {
      this.panel = new Panel()
      this.subscriptions.add(this.panel)
    }
    this.editors.onShouldRender(() => {
      if (this.panel) {
        this.panel.apply()
      }
    })
  }
  didCalculateMessages(difference: Linter$Difference) {
    this.editors.apply(difference)
    if (this.panel) {
      this.panel.apply(difference.messages)
    }
  }
  didBeginLinting(linter: Linter$Linter, filePath: string) {
    this.signal.didBeginLinting(linter, filePath)
  }
  didFinishLinting(linter: Linter$Linter, filePath: string) {
    this.signal.didFinishLinting(linter, filePath)
  }
  dispose() {
    this.active = false
    this.subscriptions.dispose()
  }
}
