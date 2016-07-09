'use babel'

import { htmlToText } from '../lib/helpers'

describe('Helpers', function() {
  afterEach(function() {
    atom.workspace.destroyActivePaneItem()
  })

  describe('htmlToText', function() {
    it('converts html to text properly', function() {
      expect(htmlToText('<button>Hey&nbsp;Man</button> What\'s Up?')).toBe('Hey Man What\'s Up?')
    })
    it('also accepts html elements', function() {
      const element = document.createElement('div')
      element.innerHTML = '<button>Hey&nbsp;Man</button> What\'s Up?'
      expect(htmlToText(element)).toBe('Hey Man What\'s Up?')
    })
  })
})
