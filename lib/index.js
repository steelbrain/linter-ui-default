'use babel'

import {CompositeDisposable} from 'atom'

export default {
  config: {
    showPanel: {
      type: 'boolean',
      description: 'Show panel at the bottom',
      default: true
    },
    messageFilter: {
      title: 'Show messages from',
      description: 'Show messages in panel from',
      type: 'string',
      enum: ['Current File', 'Current Line', 'Entire Project'],
      default: 'Current File'
    },
    showProviderNames: {
      title: 'Show names of providers on messages',
      description: 'Requires a restart to take effect',
      type: 'boolean',
      default: true
    },
    highlightIssues: {
      title: 'Underline and highlight gutters of issue lines',
      type: 'boolean',
      default: true
    },
    showBubble: {
      description: 'Show inline issue bubbles (requires Highlight Issues)',
      type: 'boolean',
      default: true
    },
    gutterPosition: {
      title: 'Position of Gutter Highlights',
      description: 'Relative to line number gutter',
      type: 'string',
      enum: ['Left', 'Right'],
      default: 'Right'
    }
  },
  activate: function() {
    const {LinterUI} = require('./main')
    this.ui = new LinterUI()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.ui)
  },
  deactivate: function() {
    this.subscriptions.dispose()
  },
  provideUI: function() {
    return this.ui
  }
}
