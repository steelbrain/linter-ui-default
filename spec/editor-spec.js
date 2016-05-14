'use babel'

/* @flow */

/* eslint-disable prefer-const */

import { Range } from 'atom'
import Editor from '../lib/editor'
import { it, wait, getMessage } from './helpers'

describe('Editor', function() {
  let editor
  let message
  let textEditor

  beforeEach(function() {
    message = getMessage()
    message.range = [[2, 0], [2, 1]]
    message.filePath = __filename
    waitsForPromise(function() {
      return atom.workspace.open(__filename).then(function() {
        textEditor = atom.workspace.getActiveTextEditor()
        editor = new Editor(textEditor, true)
      })
    })
  })
  afterEach(function() {
    editor.dispose()
    atom.workspace.destroyActivePaneItem()
  })

  describe('apply', function() {
    it('applies the messages to the editor', function() {
      expect(textEditor.getMarkerCount()).toBe(0)
      editor.apply([message], [])
      expect(textEditor.getMarkerCount()).toBe(1)
      editor.apply([], [message])
      expect(textEditor.getMarkerCount()).toBe(0)
    })
    it('makes sure that the message is updated if text is manipulated', function() {
      expect(textEditor.getMarkerCount()).toBe(0)
      editor.apply([message], [])
      expect(textEditor.getMarkerCount()).toBe(1)
      expect(Range.fromObject(message.range)).toEqual({ start: { row: 2, column: 0 }, end: { row: 2, column: 1 } })
      textEditor.getBuffer().insert([2, 0], 'Hello')
      expect(Range.fromObject(message.range)).toEqual({ start: { row: 2, column: 0 }, end: { row: 2, column: 6 } })
      editor.apply([], [message])
      expect(Range.fromObject(message.range)).toEqual({ start: { row: 2, column: 0 }, end: { row: 2, column: 6 } })
      expect(textEditor.getMarkerCount()).toBe(0)
    })
  })
  describe('Response to config', function() {
    it('responds to `tooltipFollows` config', async function() {
      const position = [2, 1]
      editor.apply([
        getMessage('Error', __filename, Range.fromObject([position, [Infinity, Infinity]]))
      ], [])

      atom.config.set('linter-ui-default.tooltipFollows', 'Keyboard')
      expect(editor.bubble).toBe(null)
      textEditor.setCursorBufferPosition(position)
      await wait(60)
      expect(editor.bubble).not.toBe(null)
      expect(typeof editor.bubble.destroy).toBe('function')

      atom.config.set('linter-ui-default.tooltipFollows', 'Mouse')
      expect(editor.bubble).toBe(null)
    })
  })
})
