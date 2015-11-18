'use babel'

import {CompositeDisposable} from 'atom'
import {LinterUI} from './ui'

export default {
  activate: function() {
    this.ui = new LinterUI()
    this.subscriptions = new CompositeDisposable(this.ui)
  },
  deactivate: function() {
    this.subscriptions.dispose()
  },
  provideUI: function() {
    return this.ui
  }
}
