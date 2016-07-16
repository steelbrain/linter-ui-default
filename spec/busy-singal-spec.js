'use babel'

import { it, wait } from 'jasmine-fix'
import BusySignal from '../lib/busy-signal'

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
    return new SignalRegistry()
  }
}

describe('BusySignal', function() {

})
