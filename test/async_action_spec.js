'use strict'

/* global describe */

import assert from 'assert'
import {
  findRenderedComponentWithType
} from 'react-addons-test-utils'

import React from 'react'

import { asyncIt } from '~/src/async_it'
import AsyncAction from '~/src/async_action'
import { mountApp } from '~/src/mount_app'

describe('Async Action', () => {
  require('./async_action/wait_route')
  require('./async_action/wait_props')
  require('./async_action/wait_state')

  describe('Error catching', () => {
    asyncIt('throws the error thrown within an async render out of the await block', async (done) => {
      const newState1 = { text: 'Carot' }
      const newState2 = { text: 'Potato' }
      const someError = new Error('blahblabla')

      class Test extends React.Component {
        constructor () {
          super()
          this.state = { text: 'Banana' }
          this.someAction = this.someAction.bind(this)
        }

        someAction () {
          this.setState(newState1)
          setTimeout(() => this.setState(newState2), 10)
        }

        render () {
          if (this.state.text === newState2.text) {
            throw someError
          }
          return <h1>{this.state.text}</h1>
        }
      }

      const aRenderedComponent = mountApp(Test)

      try {
        await new AsyncAction()
        .listenOn(aRenderedComponent)
        .readyWhen(() => aRenderedComponent.state.text === newState2.text)
        .triggerWith(aRenderedComponent.someAction)
      } catch (err) {
        assert.equal(err, someError)
        done()
        return
      }

      assert.fail('No error were thrown')
    })

    asyncIt('throws the error in the action function out of the await block', async (done) => {
      const someError = new Error('some error')
      class Test extends React.Component {
        constructor () {
          super()
          this.someAction = this.someAction.bind(this)
        }

        someAction () {
          throw someError
        }

        render () {
          return <h1>Some weird Component</h1>
        }
      }

      const aRenderedComponent = mountApp(Test)

      try {
        await new AsyncAction()
        .listenOn(aRenderedComponent)
        .triggerWith(aRenderedComponent.someAction)
      } catch (err) {
        assert.equal(err, someError)
        done()
        return
      }

      assert.fail('No errors were caught')
    })

    asyncIt('throws the error thrown in the render method (or other lifecycle method) out of the await block', async (done) => {
      const someError = new Error('some error')

      class Test extends React.Component {
        constructor () {
          super()
          this.state = { text: 'Banana' }
          this.someAction = this.someAction.bind(this)
        }

        someAction () {
          this.setState({ text: 'error' })
        }

        render () {
          if (this.state.text === 'error') {
            throw someError
          } else {
            return <h1>{this.state.text}</h1>
          }
        }
      }

      const aRenderedComponent = mountApp(Test)
      const sub = findRenderedComponentWithType(aRenderedComponent, Test)

      try {
        await new AsyncAction()
        .listenOn(sub)
        .triggerWith(sub.someAction)
      } catch (err) {
        assert.equal(err, someError)
        done()
        return
      }

      assert.fail('No errors were caught')
    })

    asyncIt('throws the error thrown in the render method (or other lifecycle method) of a sub component out of the await block', async (done) => {
      const someError = new Error('some error')

      class Test extends React.Component {
        constructor () {
          super()
          this.state = { text: 'Banana' }
          this.someAction = this.someAction.bind(this)
        }

        someAction () {
          this.setState({ text: 'error' })
        }

        render () {
          return <SubComponent text={this.state.text} />
        }
      }

      class SubComponent extends React.Component {
        static propTypes = {
          text: React.PropTypes.string.isRequired
        }

        render () {
          const text = this.props.text

          if (text === 'error') {
            throw someError
          } else {
            return <h1>{text}</h1>
          }
        }
      }

      const aRenderedComponent = mountApp(Test)
      const sub = findRenderedComponentWithType(aRenderedComponent, Test)

      try {
        await new AsyncAction()
        .listenOn(sub)
        .triggerWith(sub.someAction)
      } catch (err) {
        assert.equal(err, someError)
        done()
        return
      }

      assert.fail('No errors were caught')
    })

    asyncIt('can have many asyncAction in a test', async (done) => {
      class Test extends React.Component {
        constructor () {
          super()
          this.state = { counter: 0 }
          this.someAction = this.someAction.bind(this)
        }

        someAction () {
          this.setState({ counter: this.state.counter + 1 })
        }

        render () {
          return <h1>{this.state.counter}</h1>
        }
      }

      const aRenderedComponent = mountApp(Test)

      await new AsyncAction()
      .listenOn(aRenderedComponent)
      .triggerWith(aRenderedComponent.someAction)

      await new AsyncAction()
      .listenOn(aRenderedComponent)
      .triggerWith(aRenderedComponent.someAction)

      const numberOfAction = 2
      assert.deepStrictEqual(aRenderedComponent.state.counter, numberOfAction)
      done()
    })
  })
})
