'use babel'

import { Range } from 'atom'
import { it, wait } from 'jasmine-fix'
import Commands from '../lib/commands'
import { dispatchCommand, getMessage } from './helpers'

describe('Commands', function() {
  let commands
  let activeEditor

  beforeEach(function() {
    commands = new Commands()
    waitsForPromise(function() {
      return atom.workspace.open(__filename).then(function() {
        activeEditor = atom.workspace.getActiveTextEditor()
      })
    })
  })
  afterEach(function() {
    commands.dispose()
    atom.workspace.destroyActivePaneItem()
  })

  it('moves properly', async function() {
    spyOn(commands, 'move').andCallThrough()
    dispatchCommand(atom.workspace.getActiveTextEditor(), 'linter-ui-default:next-error')
    dispatchCommand(atom.workspace.getActiveTextEditor(), 'linter-ui-default:previous-error')

    expect(commands.move.calls.length).toBe(2)
    expect(commands.move.calls[0].args[0]).toBe(true)
    expect(commands.move.calls[1].args[0]).toBe()
  })
  it('sets position properly', async function() {
    const message = getMessage()
    message.range = Range.fromObject([[5, 0], [5, 1]])
    message.filePath = __filename
    commands.onShouldProvideMessages(function(event) {
      event.messages = [message]
    })
    commands.move(true)
    await wait(1)
    expect(activeEditor.getCursorBufferPosition()).toEqual([5, 0])
  })
  it('moves forward and backward in order', async function() {
    let line = 2
    const messages = [getMessage('Error', __filename), getMessage('Error', __filename), getMessage('Error', __filename)]
    for (const message of messages) {
      message.range = Range.fromObject([[line, 0], [line, 1]])
      line++
    }
    commands.onShouldProvideMessages(function(event) {
      event.messages = Array.from(messages)
    })
    commands.move(true)
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([2, 0])
    commands.move(true)
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([3, 0])
    commands.move(true)
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([4, 0])
    commands.move()
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([3, 0])
    commands.move()
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([2, 0])
    commands.move()
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([2, 0])
    commands.move()
    await wait(1)
    expect(activeEditor.getCursorBufferPosition().serialize()).toEqual([2, 0])
  })
})
