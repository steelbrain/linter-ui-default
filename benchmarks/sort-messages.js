'use babel'

import { sortMessages } from '../lib/helpers'
import { getMessage } from '../spec/helpers'

function executeTest(count) {
  const messages = []
  for (let i = 0; i < count; i++) {
    messages.push(getMessage())
  }
  const timeNow = performance.now()
  sortMessages(messages)
  return performance.now() - timeNow
}

module.exports = function() {
  console.log(`average sorting time for 1k messages:  ${executeTest(1000)}`)
  console.log(`average sorting time for 2k messages:  ${executeTest(2000)}`)
  console.log(`average sorting time for 3k messages:  ${executeTest(3000)}`)
  console.log(`average sorting time for 4k messages:  ${executeTest(4000)}`)
  console.log(`average sorting time for 5k messages:  ${executeTest(5000)}`)
}
