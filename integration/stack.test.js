const assert = require('node:assert/strict')
const { after, before, describe, test } = require('node:test')
const { getBaseUrl } = require('./lib/config')
const { createHttpClient } = require('./lib/httpClient')

const baseUrl = getBaseUrl()
const client = createHttpClient(baseUrl)

const testUser = {
  name: 'Integration User',
  email: `integration-${Date.now()}@example.com`,
  password: 'TestPass1',
}

let goalId

before(async () => {
  const { response, body } = await client.request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  })

  assert.equal(response.status, 201)
  assert.equal(body.email, testUser.email)
})

after(async () => {
  if (goalId) {
    await client.request(`/api/goals/${goalId}`, { method: 'DELETE' })
  }

  await client.request('/api/users/logout', { method: 'POST' })
})

describe('stack integration', () => {
  test('frontend serves the React app', async () => {
    const { response, body } = await client.request('/')

    assert.equal(response.status, 200)
    assert.match(body, /Goalsetter App/)
  })

  test('authenticated user can read their profile', async () => {
    const { response, body } = await client.request('/api/users/me')

    assert.equal(response.status, 200)
    assert.equal(body.email, testUser.email)
    assert.equal(body.name, testUser.name)
  })

  test('user can create, list, update, and delete a goal', async () => {
    const createResult = await client.request('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Learn Docker integration tests' }),
    })

    assert.equal(createResult.response.status, 200)
    assert.equal(createResult.body.text, 'Learn Docker integration tests')
    goalId = createResult.body._id

    const listResult = await client.request('/api/goals')
    assert.equal(listResult.response.status, 200)
    assert.equal(listResult.body.length, 1)
    assert.equal(listResult.body[0]._id, goalId)

    const updateResult = await client.request(`/api/goals/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Updated integration goal' }),
    })

    assert.equal(updateResult.response.status, 200)
    assert.equal(updateResult.body.text, 'Updated integration goal')

    const deleteResult = await client.request(`/api/goals/${goalId}`, {
      method: 'DELETE',
    })

    assert.equal(deleteResult.response.status, 200)
    assert.equal(deleteResult.body.id, goalId)
    goalId = undefined

    const emptyList = await client.request('/api/goals')
    assert.equal(emptyList.response.status, 200)
    assert.equal(emptyList.body.length, 0)
  })

  test('user can log in with registered credentials', async () => {
    await client.request('/api/users/logout', { method: 'POST' })

    const loginResult = await client.request('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })

    assert.equal(loginResult.response.status, 200)
    assert.equal(loginResult.body.email, testUser.email)

    const profileResult = await client.request('/api/users/me')
    assert.equal(profileResult.response.status, 200)
    assert.equal(profileResult.body.email, testUser.email)
  })

  test('protected routes reject unauthenticated requests', async () => {
    await client.request('/api/users/logout', { method: 'POST' })
    client.clearCookies()

    const { response } = await client.request('/api/goals')
    assert.equal(response.status, 401)
  })
})
