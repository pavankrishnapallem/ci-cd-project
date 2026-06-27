const assert = require('node:assert/strict')
const { afterEach, describe, test } = require('node:test')
const Module = require('node:module')

const Goal = {}
const originalLoad = Module._load

Module._load = function loadMockedModel(request, parent, isMain) {
  if (request === 'express-async-handler') {
    return (handler) => (req, res, next) =>
      Promise.resolve(handler(req, res, next)).catch(next)
  }

  if (request === '../models/goalModel') {
    return Goal
  }

  if (request === '../models/userModel') {
    return {}
  }

  return originalLoad.call(this, request, parent, isMain)
}

const {
  getGoals,
  setGoal,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController')

Module._load = originalLoad

const originalGoalMethods = {
  find: Goal.find,
  create: Goal.create,
  findById: Goal.findById,
  findByIdAndUpdate: Goal.findByIdAndUpdate,
}

afterEach(() => {
  Goal.find = originalGoalMethods.find
  Goal.create = originalGoalMethods.create
  Goal.findById = originalGoalMethods.findById
  Goal.findByIdAndUpdate = originalGoalMethods.findByIdAndUpdate
})

const createResponse = () => {
  const res = {
    statusCode: undefined,
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

const runHandler = async (handler, req) => {
  const res = createResponse()
  let nextError

  await handler(req, res, (error) => {
    nextError = error
  })

  return { res, nextError }
}

describe('goalController', () => {
  test('getGoals returns only goals for the authenticated user', async () => {
    const expectedGoals = [{ _id: 'goal-1', text: 'Write tests' }]
    let query

    Goal.find = async (criteria) => {
      query = criteria
      return expectedGoals
    }

    const { res, nextError } = await runHandler(getGoals, {
      user: { id: 'user-1' },
    })

    assert.equal(nextError, undefined)
    assert.deepEqual(query, { user: 'user-1' })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body, expectedGoals)
  })

  test('setGoal rejects requests without text', async () => {
    const { res, nextError } = await runHandler(setGoal, {
      body: {},
      user: { id: 'user-1' },
    })

    assert.equal(res.statusCode, 400)
    assert.equal(nextError.message, 'Please add a text field')
  })

  test('setGoal creates a goal for the authenticated user', async () => {
    const createdGoal = { _id: 'goal-1', text: 'Ship CI', user: 'user-1' }
    let createPayload

    Goal.create = async (payload) => {
      createPayload = payload
      return createdGoal
    }

    const { res, nextError } = await runHandler(setGoal, {
      body: { text: 'Ship CI' },
      user: { id: 'user-1' },
    })

    assert.equal(nextError, undefined)
    assert.deepEqual(createPayload, { text: 'Ship CI', user: 'user-1' })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body, createdGoal)
  })

  test('updateGoal prevents users from editing another user goal', async () => {
    Goal.findById = async () => ({
      user: { toString: () => 'owner-user' },
    })

    const { res, nextError } = await runHandler(updateGoal, {
      params: { id: 'goal-1' },
      body: { text: 'New text' },
      user: { id: 'other-user' },
    })

    assert.equal(res.statusCode, 401)
    assert.equal(nextError.message, 'User not authorized')
  })

  test('deleteGoal removes a goal owned by the authenticated user', async () => {
    let removed = false

    Goal.findById = async () => ({
      user: { toString: () => 'user-1' },
      remove: async () => {
        removed = true
      },
    })

    const { res, nextError } = await runHandler(deleteGoal, {
      params: { id: 'goal-1' },
      user: { id: 'user-1' },
    })

    assert.equal(nextError, undefined)
    assert.equal(removed, true)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body, { id: 'goal-1' })
  })
})
