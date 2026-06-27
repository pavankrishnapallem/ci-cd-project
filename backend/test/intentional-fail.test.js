const { describe, test } = require('node:test')
const assert = require('node:assert/strict')

describe('Intentional failure', () => {
  test('this test always fails', () => {
    assert.equal(1, 2, 'Intentional failure to test CI')
  })
})
