const parseSetCookie = (setCookieHeader) => {
  const [pair] = setCookieHeader.split(';')
  const separatorIndex = pair.indexOf('=')
  const name = pair.slice(0, separatorIndex).trim()
  const value = pair.slice(separatorIndex + 1)

  return { name, value }
}

const createHttpClient = (baseUrl) => {
  const cookies = new Map()

  const getCookieHeader = () =>
    Array.from(cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')

  const storeCookies = (response) => {
    const setCookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : []

    for (const header of setCookies) {
      const { name, value } = parseSetCookie(header)
      cookies.set(name, value)
    }
  }

  const request = async (path, options = {}) => {
    const url = new URL(path, baseUrl)
    const headers = { ...options.headers }

    const cookieHeader = getCookieHeader()
    if (cookieHeader) {
      headers.Cookie = cookieHeader
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    storeCookies(response)

    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    return { response, body }
  }

  const clearCookies = () => cookies.clear()

  return { request, clearCookies }
}

module.exports = { createHttpClient }
