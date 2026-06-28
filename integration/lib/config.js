const DEFAULT_BASE_URL = 'http://localhost:3000'

const getBaseUrl = () => process.env.INTEGRATION_BASE_URL || DEFAULT_BASE_URL

module.exports = { getBaseUrl, DEFAULT_BASE_URL }
