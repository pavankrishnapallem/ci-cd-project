const assert = require('node:assert/strict')
const { afterEach, describe, test } = require('node:test')

const { errorHandler } = require('../middleware/errorMiddleware')

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

const createResponse = (statusCode) => {
  const res = {
    statusCode,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }

  return res
}

describe('errorMiddleware', () => {
  test('uses the current response status and returns the error message', () => {
    process.env.NODE_ENV = 'test'
    const res = createResponse(400)

    errorHandler(new Error('Invalid credentials'), {}, res, () => {})

    assert.equal(res.statusCode, 400)
    assert.equal(res.body.message, 'Invalid credentials')
    assert.match(res.body.stack, /Invalid credentials/)
  })

  test('defaults to 500 and hides the stack in production', () => {
    process.env.NODE_ENV = 'production'
    const res = createResponse()

    errorHandler(new Error('Something failed'), {}, res, () => {})

    assert.equal(res.statusCode, 500)
    assert.deepEqual(res.body, {
      message: 'Something failed',
      stack: null,
    })
  })
})
