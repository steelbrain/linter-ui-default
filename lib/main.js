'use babel'

import {CompositeDisposable} from 'atom'
import {LinterUI} from './provider'

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
      default: false
    },
    gutterEnabled: {
      title: 'Highlight Error Lines in Gutter',
      type: 'boolean',
      default: true
    },
    gutterPosition: {
      title: 'Position of Gutter Highlights',
      description: 'Relative to line number gutter',
      type: 'string',
      enum: ['Left', 'Right'],
      default: 'Right'
    },
    underlineIssues: {
      title: 'Underline issues',
      type: 'boolean',
      default: true
    }
  },
  activate: function() {
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
