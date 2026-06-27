import axios from 'axios'

const API_URL = '/api/goals/'
const axiosConfig = { withCredentials: true }

const requestWithRefresh = async (request) => {
  try {
    return await request()
  } catch (error) {
    if (error.response && error.response.status === 401) {
      await axios.post('/api/users/refresh', {}, axiosConfig)
      return request()
    }

    throw error
  }
}

// Create new goal
const createGoal = async (goalData) => {
  const response = await requestWithRefresh(() =>
    axios.post(API_URL, goalData, axiosConfig)
  )

  return response.data
}

// Get user goals
const getGoals = async () => {
  const response = await requestWithRefresh(() => axios.get(API_URL, axiosConfig))

  return response.data
}

// Update user goal
const updateGoal = async (goalId, goalData) => {
  const response = await requestWithRefresh(() =>
    axios.put(API_URL + goalId, goalData, axiosConfig)
  )

  return response.data
}

// Delete user goal
const deleteGoal = async (goalId) => {
  const response = await requestWithRefresh(() =>
    axios.delete(API_URL + goalId, axiosConfig)
  )

  return response.data
}

const goalService = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
}

export default goalService
