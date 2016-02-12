'use babel'

import {CompositeDisposable} from 'atom'

export default {
  config: {
    showPanel: {
      type: 'boolean',
      description: 'Show panel at the bottom',
      default: true
    },
    panelHeight: {
      description: 'Height of the panel (in px)',
      type: 'number',
      default: 150
    },
    showIssuesFromAllFiles: {
      title: 'Show issues from all files',
      description: 'Show issues from all files in bottom panel instead of the selected one',
      type: 'boolean',
      default: false
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
