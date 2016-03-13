'use babel'

describe('Benchmarks', function() {
  describe('Sorting messages', function() {
    it('is fast', function() {
      require('../benchmarks/sort-messages')()
    })
  })
})
