'use babel'

/* @flow */

import { CompositeDisposable } from 'atom'
import Panel from './panel'
import Editors from './editors'
import Commands from './commands'
import BusySignal from './busy-signal'
import Intentions from './intentions'
import type { Linter, Message, MessagesPatch } from './types'

export default class LinterUI {
  name: string;
  panel: ?Panel;
  active: boolean;
  signal: BusySignal;
  editors: Editors;
  commands: Commands;
  messages: Array<Message>;
  intentions: Intentions;
  subscriptions: CompositeDisposable;

  constructor() {
    this.name = 'Linter'
    this.signal = new BusySignal()
    this.messages = []
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
    this.subscriptions.add(atom.config.observe('linter-ui-default.showPanel', showPanel => {
      if (showPanel && !this.panel) {
        this.panel = new Panel()
        this.panel.apply(this.messages)
      } else if (!showPanel && this.panel) {
        this.panel.dispose()
        this.panel = null
      }
    }))
    this.editors.onShouldRender(() => {
      if (this.panel) {
        this.panel.apply();
      }
    })
  }
  render(difference: MessagesPatch) {
    console.log(difference)
    this.messages = difference.messages
    this.editors.apply(difference)
    if (this.panel) {
      this.panel.apply(difference.messages)
    }
  }
  didBeginLinting(linter: Linter, filePath: string) {
    this.signal.didBeginLinting(linter, filePath)
  }
  didFinishLinting(linter: Linter, filePath: string) {
    this.signal.didFinishLinting(linter, filePath)
  }
  dispose() {
    this.active = false
    this.subscriptions.dispose()
    if (this.panel) {
      this.panel.dispose()
    }
  }
}
