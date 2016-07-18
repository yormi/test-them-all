'use strict'

/* global it */

let testInDebugMode = false
export const isTestInDebugMode = () => testInDebugMode

export const asyncIt = (description, test, config) => {
  const decoratedTest = _decorateTest(test, config)
  it(description, decoratedTest)
}

asyncIt.only = (description, test) => {
  const decoratedTest = _decorateTest(test)
  it.only(description, decoratedTest)
}

asyncIt.skip = (description, test) => {
  const decoratedTest = _decorateTest(test)
  it.skip(description, decoratedTest)
}

export const _decorateTest = (test, config) => {
  return async (done) => {
    testInDebugMode = config === 'debug'
    try {
      await test()
      testInDebugMode = false
      done()
    } catch (err) {
      done(err)
    }
  }
}
