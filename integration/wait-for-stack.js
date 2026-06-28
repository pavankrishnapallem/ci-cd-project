const { getBaseUrl } = require('./lib/config')

const TIMEOUT_MS = Number(process.env.INTEGRATION_WAIT_TIMEOUT_MS || 120000)
const INTERVAL_MS = Number(process.env.INTEGRATION_WAIT_INTERVAL_MS || 3000)

const waitForStack = async () => {
  const baseUrl = getBaseUrl()
  const deadline = Date.now() + TIMEOUT_MS

  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL('/', baseUrl))

      if (response.ok) {
        const apiResponse = await fetch(new URL('/api/users/me', baseUrl))

        if (apiResponse.status === 401) {
          console.log(`Stack is ready at ${baseUrl}`)
          return
        }
      }
    } catch {
      // Stack is still starting
    }

    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS))
  }

  console.error(`Timed out waiting for stack at ${baseUrl}`)
  process.exit(1)
}

waitForStack()
