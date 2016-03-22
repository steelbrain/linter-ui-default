'use babel'

export function getMessage(type = 'Error', filePath, range) {
  return { type, text: 'Some Message', filePath, range }
}

export function dispatchCommand(target: Object, commandName: string) {
  atom.commands.dispatch(atom.views.getView(target), commandName)
}

// Our sugar method that allows us to pass async functions and do await in it
export function it(name, callback) {
  global.it(name, function() {
    const value = callback()
    if (value && value.constructor.name === 'Promise') {
      waitsForPromise(function() {
        return value
      })
    }
  })
}

export function wait(timeout) {
  return new Promise(function(resolve) {
    setTimeout(resolve, timeout)
  })
}

// Jasmine 1.3.x has no sane way of resetting to native clocks, and since we're
// gonna test promises and such, we're gonna need it
function resetClock() {
  for (const key in jasmine.Clock.real) {
    if (jasmine.Clock.real.hasOwnProperty(key)) {
      window[key] = jasmine.Clock.real[key]
    }
  }
}

beforeEach(function() {
  resetClock()
})
