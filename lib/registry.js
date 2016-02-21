'use babel'

/* @flow */

import {CompositeDisposable, Disposable} from 'atom'
import type {TextEditor} from 'atom'
import type {Linter$Message} from './types'

type Registry$Entry = {
  filePath: string,
  messages: Array<Linter$Message>,
  textEditor: ?TextEditor
};

export class Registry {
  registry: Set<Registry$Entry>;
  subscriptions: CompositeDisposable;

  constructor() {
    this.registry = new Set()
    this.subscriptions = new CompositeDisposable()
  }
  activate() {

  }
  getByTextEditor(textEditor: TextEditor): Registry$Entry {
    let found
    for (const entry of this.registry) {
      if (entry.textEditor === textEditor) {
        found = entry
        break
      }
    }
    if (!found) {
      found = Registry.createEntry(textEditor.getPath())
      found.textEditor = textEditor
      this.registry.add(found)
    }
    return found
  }
  getByFilePath(filePath: string): Registry$Entry {
    let found
    for (const entry of this.registry) {
      if (entry.filePath === filePath) {
        found = entry
        break
      }
    }
    if (!found) {
      found = Registry.createEntry(filePath)
      this.registry.add(found)
    }
    return found
  }
  dispose() {
    this.registry.clear()
    this.subscriptions.dispose()
  }
  static createEntry(filePath: string): Registry$Entry {
    return {
      filePath: filePath,
      textEditor: null,
      messages: []
    }
  }
}
