/* @flow */
// eslint-disable-next-line import/no-unassigned-import
import 'module-alias/register'
import { Range } from 'atom'
// eslint-disable-next-line no-unused-vars
import { it, beforeEach, afterEach } from 'jasmine-fix'
import Editor from '../dist/editor'
import { getMessage } from './helpers'

describe('Editor', function () {
  let editor
  let message
  let textEditor

  beforeEach(async function () {
    message = getMessage()
    message.location.position = [
      [2, 0],
      [2, 1],
    ]
    message.location.file = __filename
    await atom.workspace.open(__filename)
    textEditor = atom.workspace.getActiveTextEditor()
    editor = new Editor(textEditor)

    // Activate activation hook
    atom.packages.triggerDeferredActivationHooks()
    atom.packages.triggerActivationHook('core:loaded-shell-environment')

    atom.packages.loadPackage('linter-ui-default')
  })
  afterEach(function () {
    editor.dispose()
    atom.workspace.destroyActivePaneItem()
  })

  describe('applyChanges', function () {
    it('applies the messages to the editor', function () {
      expect(textEditor.getBuffer().getMarkerCount()).toBe(0)
      editor.applyChanges([message], [])
      expect(textEditor.getBuffer().getMarkerCount()).toBe(1)
      editor.applyChanges([], [message])
      expect(textEditor.getBuffer().getMarkerCount()).toBe(0)
    })
    it('makes sure that the message is updated if text is manipulated', function () {
      expect(textEditor.getBuffer().getMarkerCount()).toBe(0)
      editor.applyChanges([message], [])
      expect(textEditor.getBuffer().getMarkerCount()).toBe(1)
      expect(Range.fromObject(message.location.position)).toEqual({
        start: { row: 2, column: 0 },
        end: { row: 2, column: 1 },
      })
      textEditor.getBuffer().insert([2, 0], 'Hello')
      expect(Range.fromObject(message.location.position)).toEqual({
        start: { row: 2, column: 0 },
        end: { row: 2, column: 6 },
      })
      editor.applyChanges([], [message])
      expect(Range.fromObject(message.location.position)).toEqual({
        start: { row: 2, column: 0 },
        end: { row: 2, column: 6 },
      })
      expect(textEditor.getBuffer().getMarkerCount()).toBe(0)
    })
  })
  describe('Response to config', function () {
    it('responds to `gutterPosition`', function () {
      atom.config.set('linter-ui-default.gutterPosition', 'Left')
      expect(editor.gutter && editor.gutter.priority).toBe(-100)
      atom.config.set('linter-ui-default.gutterPosition', 'Right')
      expect(editor.gutter && editor.gutter.priority).toBe(100)
    })
    it('responds to `showDecorations`', function () {
      atom.config.set('linter-ui-default.showDecorations', false)
      expect(editor.gutter).toBe(null)
      atom.config.set('linter-ui-default.showDecorations', true)
      expect(editor.gutter).not.toBe(null)
    })
  })
})
