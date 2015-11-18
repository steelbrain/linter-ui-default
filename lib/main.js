'use babel'

import {CompositeDisposable} from 'atom'
import {LinterUI} from './ui'

export default {
  config: {
    showPanel: {
      type: 'boolean',
      description: 'Show panel on the bottom',
      default: true
    },
    showIssuesFromAllFiles: {
      title: 'Show issues from all files',
      description: 'Display all of the issues in bottom panel instead of only current file ones',
      type: 'boolean',
      default: true
    }
  },
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
