const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')

const getCookie = (req, name) => {
  if (req.cookies && req.cookies[name]) {
    return req.cookies[name]
  }

  const cookieHeader = req.headers.cookie

  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...value] = cookie.trim().split('=')
    acc[key] = decodeURIComponent(value.join('='))
    return acc
  }, {})

  return cookies[name] || null
}

const protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else {
    token = getCookie(req, 'accessToken')
  }

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password')

    if (!req.user) {
      res.status(401)
      throw new Error('Not authorized')
    }

    next()
  } catch (error) {
    console.log(error)
    res.status(401)
    throw new Error('Not authorized')
  }
})

module.exports = { protect }
