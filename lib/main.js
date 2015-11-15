'use babel'

import {CompositeDisposable} from 'atom'

export default {
  activate: function() {
    this.subscriptions = new CompositeDisposable()
  },
  deactivate: function() {
    this.subscriptions.dispose()
  },
  provideUI: function() {
    return {
      name: 'Default'
    }
  }
}
