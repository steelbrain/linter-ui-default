'use babel'

/* @flow */

/* eslint-disable prefer-const */

import { Range } from 'atom'
import Buffer from '../lib/buffer'
import { getMessage } from './helpers'

describe('Buffer', function() {
  let buffer
  let message
  let textBuffer

  beforeEach(function() {
    message = getMessage()
    message.range = [[2, 0], [2, 1]]
    message.filePath = __filename
    waitsForPromise(function() {
      return atom.workspace.open(__filename).then(function() {
        textBuffer = atom.workspace.getActiveTextEditor().getBuffer()
        buffer = new Buffer(textBuffer)
      })
    })
  })
  afterEach(function() {
    buffer.dispose()
    atom.workspace.destroyActivePaneItem()
  })

  describe('apply', function() {
    it('applies the messages to the buffer', function() {
      expect(textBuffer.getMarkerCount()).toBe(0)
      buffer.apply([message], [])
      expect(textBuffer.getMarkerCount()).toBe(1)
      buffer.apply([], [message])
      expect(textBuffer.getMarkerCount()).toBe(0)
    })
    it('makes sure that the message is updated if text is manipulated', function() {
      expect(textBuffer.getMarkerCount()).toBe(0)
      buffer.apply([message], [])
      expect(textBuffer.getMarkerCount()).toBe(1)
      expect(Range.fromObject(message.range)).toEqual({ start: { row: 2, column: 0 }, end: { row: 2, column: 1 } })
      textBuffer.insert([2, 0], 'Hello')
      expect(Range.fromObject(message.range)).toEqual({ start: { row: 2, column: 0 }, end: { row: 2, column: 6 } })
      buffer.apply([], [message])
      expect(Range.fromObject(message.range)).toEqual({ start: { row: 2, column: 0 }, end: { row: 2, column: 6 } })
      expect(textBuffer.getMarkerCount()).toBe(0)
    })
  })
})
