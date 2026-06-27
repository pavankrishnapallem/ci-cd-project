const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'
const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

const normalizeEmail = (email) => email.trim().toLowerCase()

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())

const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include uppercase, lowercase, and number characters'
  }

  return null
}

const validateAuthInput = ({ name, email, password }, requireName = false) => {
  if (requireName && (!name || !name.trim())) {
    return 'Please add a name'
  }

  if (!email || !isValidEmail(email)) {
    return 'Please add a valid email'
  }

  if (!password) {
    return 'Please add a password'
  }

  return validatePassword(password)
}

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
  maxAge,
})

const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET

const sendAuthCookies = (res, id) => {
  res.cookie(
    ACCESS_TOKEN_COOKIE,
    generateAccessToken(id),
    getCookieOptions(15 * 60 * 1000)
  )
  res.cookie(
    REFRESH_TOKEN_COOKIE,
    generateRefreshToken(id),
    getCookieOptions(7 * 24 * 60 * 60 * 1000)
  )
}

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, getCookieOptions(0))
  res.clearCookie(REFRESH_TOKEN_COOKIE, getCookieOptions(0))
}

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const validationError = validateAuthInput({ name, email, password }, true)

  if (validationError) {
    res.status(400)
    throw new Error(validationError)
  }

  const normalizedEmail = normalizeEmail(email)

  // Check if user exists
  const userExists = await User.findOne({ email: normalizedEmail })

  if (userExists) {
    res.status(400)
    throw new Error('User already exists')
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  })

  if (user) {
    sendAuthCookies(res, user._id)

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const validationError = validateAuthInput({ email, password })

  if (validationError) {
    res.status(400)
    throw new Error(validationError)
  }

  // Check for user email
  const user = await User.findOne({ email: normalizeEmail(email) })

  if (user && (await bcrypt.compare(password, user.password))) {
    sendAuthCookies(res, user._id)

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
    })
  } else {
    res.status(400)
    throw new Error('Invalid credentials')
  }
})

// @desc    Refresh access token
// @route   POST /api/users/refresh
// @access  Public
const refreshUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE]

  if (!refreshToken) {
    res.status(401)
    throw new Error('Not authorized, no refresh token')
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret())
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      res.status(401)
      throw new Error('Not authorized')
    }

    res.cookie(
      ACCESS_TOKEN_COOKIE,
      generateAccessToken(user._id),
      getCookieOptions(15 * 60 * 1000)
    )

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    res.status(401)
    throw new Error('Not authorized')
  }
})

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  clearAuthCookies(res)
  res.status(200).json({ message: 'Logged out' })
})

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user)
})

// Generate JWTs
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  })
}

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  })
}

module.exports = {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  getMe,
}
