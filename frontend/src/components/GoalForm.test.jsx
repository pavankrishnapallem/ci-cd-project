import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import GoalForm from './GoalForm'
import { createGoal } from '../features/goals/goalSlice'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}))

jest.mock('../features/goals/goalSlice', () => ({
  createGoal: jest.fn(),
}))

describe('GoalForm', () => {
  let dispatch

  beforeEach(() => {
    jest.clearAllMocks()
    dispatch = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({}),
    }))
    useDispatch.mockReturnValue(dispatch)
    createGoal.mockReturnValue({ type: 'goals/create' })
  })

  test('dispatches createGoal with trimmed text and clears the input', async () => {
    const { getByLabelText, getByText } = render(<GoalForm />)
    const input = getByLabelText('Goal')

    fireEvent.change(input, { target: { value: '  Learn testing  ' } })
    await act(async () => {
      fireEvent.click(getByText('Add Goal'))
      await Promise.resolve()
    })

    expect(createGoal).toHaveBeenCalledWith({ text: 'Learn testing' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'goals/create' })
    expect(input.value).toBe('')
  })

  test('shows an error and does not dispatch when text is blank', () => {
    const { getByLabelText, getByText } = render(<GoalForm />)

    fireEvent.change(getByLabelText('Goal'), { target: { value: '   ' } })
    fireEvent.click(getByText('Add Goal'))

    expect(toast.error).toHaveBeenCalledWith('Please add a goal')
    expect(createGoal).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })
})
