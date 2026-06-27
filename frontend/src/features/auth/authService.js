import axios from 'axios'

const API_URL = '/api/users/'
const axiosConfig = { withCredentials: true }

const storeUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

// Register user
const register = async (userData) => {
  const response = await axios.post(API_URL, userData, axiosConfig)

  storeUser(response.data)

  return response.data
}

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData, axiosConfig)

  storeUser(response.data)

  return response.data
}

// Refresh user session
const refresh = async () => {
  const response = await axios.post(API_URL + 'refresh', {}, axiosConfig)

  storeUser(response.data)

  return response.data
}

// Logout user
const logout = async () => {
  await axios.post(API_URL + 'logout', {}, axiosConfig)
  localStorage.removeItem('user')
}

const authService = {
  register,
  logout,
  login,
  refresh,
}

export default authService
