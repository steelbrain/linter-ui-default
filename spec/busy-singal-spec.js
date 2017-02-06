/* @flow */

import BusySignal from '../lib/busy-signal'
import { getLinter } from './helpers'

class SignalRegistry {
  texts: Array<string>;
  constructor() {
    this.texts = []
  }
  clear() {
    this.texts = []
  }
  add(text) {
    this.texts.push(text)
  }
  static create() {
    const registry = new SignalRegistry()
    spyOn(registry, 'add').andCallThrough()
    spyOn(registry, 'clear').andCallThrough()
    return registry
  }
}

describe('BusySignal', function() {
  let busySignal

  beforeEach(function() {
    busySignal = new BusySignal()
    busySignal.attach(SignalRegistry)
  })
  afterEach(function() {
    busySignal.dispose()
  })

  it('tells the registry when linting is in progress without adding duplicates', function() {
    const linterA = getLinter()
    expect(busySignal.provider && busySignal.provider.texts).toEqual([])
    busySignal.didBeginLinting(linterA, '/')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /'])
    busySignal.didFinishLinting(linterA, '/')
    busySignal.didFinishLinting(linterA, '/')
    expect(busySignal.provider && busySignal.provider.texts).toEqual([])
    busySignal.didBeginLinting(linterA, '/')
    busySignal.didBeginLinting(linterA, '/')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /'])
    busySignal.didFinishLinting(linterA, '/')
    expect(busySignal.provider && busySignal.provider.texts).toEqual([])
  })
  it('shows one line per file and one for all project scoped ones', function() {
    const linterA = getLinter()
    const linterB = getLinter()
    const linterC = getLinter()
    const linterD = getLinter()
    const linterE = getLinter()
    busySignal.didBeginLinting(linterA, '/a')
    busySignal.didBeginLinting(linterA, '/aa')
    busySignal.didBeginLinting(linterB, '/b')
    busySignal.didBeginLinting(linterC, '/b')
    busySignal.didBeginLinting(linterD)
    busySignal.didBeginLinting(linterE)
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /a', 'some on /aa', 'some, some on /b', 'some, some'])
    busySignal.didFinishLinting(linterA)
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /a', 'some on /aa', 'some, some on /b', 'some, some'])
    busySignal.didFinishLinting(linterA, '/a')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /aa', 'some, some on /b', 'some, some'])
    busySignal.didFinishLinting(linterA, '/aa')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some, some on /b', 'some, some'])
    busySignal.didFinishLinting(linterB, '/b')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /b', 'some, some'])
    busySignal.didFinishLinting(linterC, '/b')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some, some'])
    busySignal.didFinishLinting(linterD, '/b')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some, some'])
    busySignal.didFinishLinting(linterD)
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some'])
    busySignal.didFinishLinting(linterE)
    expect(busySignal.provider && busySignal.provider.texts).toEqual([])
  })
  it('clears everything on dispose', function() {
    const linterA = getLinter()
    busySignal.didBeginLinting(linterA, '/a')
    expect(busySignal.provider && busySignal.provider.texts).toEqual(['some on /a'])
    busySignal.dispose()
    expect(busySignal.provider && busySignal.provider.texts).toEqual([])
  })
})
