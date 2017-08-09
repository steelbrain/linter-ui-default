/* @flow */

import { beforeEach } from 'jasmine-fix'
import BusySignal from '../lib/busy-signal'
import { getLinter } from './helpers'

class SignalRegistry {
  texts: Array<string>;
  constructor() {
    this.texts = []
  }
  clear() {
    this.texts.splice(0)
  }
  add(text) {
    if (this.texts.includes(text)) {
      throw new TypeError(`'${text}' already added`)
    }
    this.texts.push(text)
  }
  remove(text) {
    const index = this.texts.indexOf(text)
    if (index !== -1) {
      this.texts.splice(index, 1)
    }
  }
  static create() {
    const registry = new SignalRegistry()
    spyOn(registry, 'add').andCallThrough()
    spyOn(registry, 'remove').andCallThrough()
    spyOn(registry, 'clear').andCallThrough()
    return registry
  }
}

describe('BusySignal', function() {
  let busySignal

  beforeEach(async function() {
    await atom.packages.loadPackage('linter-ui-default')
    busySignal = new BusySignal()
    busySignal.attach(SignalRegistry)
  })
  afterEach(function() {
    busySignal.dispose()
  })

  it('tells the registry when linting is in progress without adding duplicates', function() {
    const linterA = getLinter()
    const texts = busySignal.provider && busySignal.provider.texts
    expect(texts).toEqual([])
    busySignal.didBeginLinting(linterA, '/')
    expect(texts).toEqual(['some on /'])
    busySignal.didFinishLinting(linterA, '/')
    busySignal.didFinishLinting(linterA, '/')
    expect(texts).toEqual([])
    busySignal.didBeginLinting(linterA, '/')
    busySignal.didBeginLinting(linterA, '/')
    expect(texts).toEqual(['some on /'])
    busySignal.didFinishLinting(linterA, '/')
    expect(texts).toEqual([])
  })
  it('shows one line per file and one for all project scoped ones', function() {
    const linterA = getLinter('A')
    const linterB = getLinter('B')
    const linterC = getLinter('C')
    const linterD = getLinter('D')
    const linterE = getLinter('E')
    busySignal.didBeginLinting(linterA, '/a')
    busySignal.didBeginLinting(linterA, '/aa')
    busySignal.didBeginLinting(linterB, '/b')
    busySignal.didBeginLinting(linterC, '/b')
    busySignal.didBeginLinting(linterD)
    busySignal.didBeginLinting(linterE)
    const texts = busySignal.provider && busySignal.provider.texts
    // Test initial state
    expect(texts).toEqual(['A on /a', 'A on /aa', 'B on /b', 'C on /b', 'D', 'E'])
    // Test finish event for no file for a linter
    busySignal.didFinishLinting(linterA)
    expect(texts).toEqual(['A on /a', 'A on /aa', 'B on /b', 'C on /b', 'D', 'E'])
    // Test finish of a single file of a linter with two files running
    busySignal.didFinishLinting(linterA, '/a')
    expect(texts).toEqual(['A on /aa', 'B on /b', 'C on /b', 'D', 'E'])
    // Test finish of the last remaining file for linterA
    busySignal.didFinishLinting(linterA, '/aa')
    expect(texts).toEqual(['B on /b', 'C on /b', 'D', 'E'])
    // Test finish of first linter of two running on '/b'
    busySignal.didFinishLinting(linterB, '/b')
    expect(texts).toEqual(['C on /b', 'D', 'E'])
    // Test finish of second (last) linter running on '/b'
    busySignal.didFinishLinting(linterC, '/b')
    expect(texts).toEqual(['D', 'E'])
    // Test finish even for an unkown file for a linter
    busySignal.didFinishLinting(linterD, '/b')
    expect(texts).toEqual(['D', 'E'])
    // Test finishing a project linter (no file)
    busySignal.didFinishLinting(linterD)
    expect(texts).toEqual(['E'])
    // Test finishing the last linter
    busySignal.didFinishLinting(linterE)
    expect(texts).toEqual([])
  })
  it('clears everything on dispose', function() {
    const linterA = getLinter()
    busySignal.didBeginLinting(linterA, '/a')
    const texts = busySignal.provider && busySignal.provider.texts
    expect(texts).toEqual(['some on /a'])
    busySignal.dispose()
    expect(texts).toEqual([])
  })
})
