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
    expect(busySignal.provider.texts).toEqual([])
    busySignal.didBeginLinting(linterA, '/')
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /'])
    busySignal.didFinishLinting(linterA, '/')
    busySignal.didFinishLinting(linterA, '/')
    expect(busySignal.provider.texts).toEqual([])
    busySignal.didBeginLinting(linterA, '/')
    busySignal.didBeginLinting(linterA, '/')
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /'])
    busySignal.didFinishLinting(linterA, '/')
    expect(busySignal.provider.texts).toEqual([])
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
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /a', 'Linters (some) running on /aa', 'Linters (some, some) running on /b', 'Linters (some, some) running'])
    busySignal.didFinishLinting(linterA)
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /a', 'Linters (some) running on /aa', 'Linters (some, some) running on /b', 'Linters (some, some) running'])
    busySignal.didFinishLinting(linterA, '/a')
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /aa', 'Linters (some, some) running on /b', 'Linters (some, some) running'])
    busySignal.didFinishLinting(linterA, '/aa')
    expect(busySignal.provider.texts).toEqual(['Linters (some, some) running on /b', 'Linters (some, some) running'])
    busySignal.didFinishLinting(linterB, '/b')
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /b', 'Linters (some, some) running'])
    busySignal.didFinishLinting(linterC, '/b')
    expect(busySignal.provider.texts).toEqual(['Linters (some, some) running'])
    busySignal.didFinishLinting(linterD, '/b')
    expect(busySignal.provider.texts).toEqual(['Linters (some, some) running'])
    busySignal.didFinishLinting(linterD)
    expect(busySignal.provider.texts).toEqual(['Linters (some) running'])
    busySignal.didFinishLinting(linterE)
    expect(busySignal.provider.texts).toEqual([])
  })
  it('clears everything on dispose', function() {
    const linterA = getLinter()
    busySignal.didBeginLinting(linterA, '/a')
    expect(busySignal.provider.texts).toEqual(['Linters (some) running on /a'])
    busySignal.dispose()
    expect(busySignal.provider.texts).toEqual([])
  })
})
