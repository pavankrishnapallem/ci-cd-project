import React from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App'

test('renders GoalSetter navigation', () => {
  const { getAllByText, getByText } = render(
    <Provider store={store}>
      <App />
    </Provider>
  )

  expect(getByText('GoalSetter')).toBeInTheDocument()
  expect(getAllByText('Login')[0]).toBeInTheDocument()
  expect(getByText('Register')).toBeInTheDocument()
})
