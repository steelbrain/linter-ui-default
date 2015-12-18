'use babel'

import {CompositeDisposable} from 'atom'
import {getEditorsMap} from './helpers'

export class LinterUI {
  constructor() {
    this.name = 'Linter'
    this.editors = new Set()
    this.editorRegistry = null
    this.subscriptions = new CompositeDisposable()
  }
  activate(editorRegistry) {
    this.editorRegistry = editorRegistry
  }
  didCalculateMessages({added, removed, messages}) {

  }
  didBeginLinting(linter, filePath) {

  }
  didFinishLinting(linter, filePath) {

  }
  dispose() {
    this.editorRegistry = null
    this.subscriptions.dispose()
  }
}
