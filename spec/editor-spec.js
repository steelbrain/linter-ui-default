'use babel'

/* @flow */

/* eslint-disable prefer-const */

import { Range, Point } from 'atom'
import Editor from '../lib/editor'
import { it, wait, getMessage, generateEvent } from './helpers'

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
        editor = new Editor(textEditor)
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
      const editorElement = atom.views.getView(textEditor)
      editor.apply([
        getMessage('Error', __filename, Range.fromObject([position, [Infinity, Infinity]]))
      ], [])

      atom.config.set('linter-ui-default.tooltipFollows', 'Keyboard')
      expect(editor.bubble).toBe(null)
      textEditor.setCursorBufferPosition(position)
      await wait(60)
      expect(editor.bubble).not.toBe(null)
      expect(typeof editor.bubble.destroy).toBe('function')

      const pixelPosition = { top: 0, left: 0 }
      atom.config.set('linter-ui-default.tooltipFollows', 'Mouse')
      expect(editor.bubble).toBe(null)
      const event = generateEvent(editorElement, 'mousemove')
      Object.defineProperty(event, 'target', { value: editorElement })
      editorElement.dispatchEvent(event)
      spyOn(textEditor, 'bufferPositionForScreenPosition').andCallFake(function() {
        return Point.fromObject(position)
      })
      spyOn(textEditor, 'pixelPositionForScreenPosition').andCallFake(function() {
        return pixelPosition
      })
      spyOn(editorElement.component, 'pixelPositionForMouseEvent').andCallFake(function() {
        return pixelPosition
      })
      await wait(200)
      expect(editor.bubble).not.toBe(null)
      expect(typeof editor.bubble.destroy).toBe('function')
    })
  })
  it('responds to `gutterPosition` config', function() {
    atom.config.set('linter-ui-default.gutterPosition', 'Left')
    expect(editor.gutter.priority).toBe(-100)
    atom.config.set('linter-ui-default.gutterPosition', 'Right')
    expect(editor.gutter.priority).toBe(100)
  })
})
