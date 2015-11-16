'use babel'

import {CompositeDisposable} from 'atom'
import {LinterUI} from './ui'

export default {
  activate: function() {
    this.subscriptions = new CompositeDisposable()
  },
  deactivate: function() {
    this.subscriptions.dispose()
  },
  provideUI: function() {
    return LinterUI
  }
}
