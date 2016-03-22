'use babel'

import Panel from '../lib/panel'
import { getMessage } from './helpers'

describe('Panel', function() {
  let panel
  let currentConfig

  beforeEach(function() {
    currentConfig = atom.config.get('linter-ui-default')
    panel = new Panel()
    atom.packages.loadPackage('linter-ui-default')
  })
  afterEach(function() {
    panel.dispose()
    atom.config.set('linter-ui-default', currentConfig)
  })

  it('respects messageTypesToIgnoreInPanel config', function() {
    let time = 0
    const message = getMessage()
    panel.observeMessages(function(messages) {
      time++
      if (time === 1 || time === 3) {
        expect(messages).toEqual([])
      } else if (time === 2) {
        expect(messages).toEqual([message])
      }
    })
    atom.config.set('linter-ui-default.showIssuesFrom', 'All Files')
    atom.config.set('linter-ui-default.messageTypesToIgnoreInPanel', [])
    panel.apply([message])
    atom.config.set('linter-ui-default.messageTypesToIgnoreInPanel', ['Error'])
    expect(time).toBe(3)
  })
})
