import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import GoalItem from './GoalItem'
import { deleteGoal, updateGoal } from '../features/goals/goalSlice'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}))

jest.mock('../features/goals/goalSlice', () => ({
  deleteGoal: jest.fn(),
  updateGoal: jest.fn(),
}))

const goal = {
  _id: 'goal-1',
  text: 'Original goal',
  createdAt: '2026-06-27T05:30:00.000Z',
}

describe('GoalItem', () => {
  let dispatch

  beforeEach(() => {
    jest.clearAllMocks()
    dispatch = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({}),
    }))
    useDispatch.mockReturnValue(dispatch)
    deleteGoal.mockReturnValue({ type: 'goals/delete' })
    updateGoal.mockReturnValue({ type: 'goals/update' })
  })

  test('dispatches deleteGoal when delete is clicked', () => {
    const { getByLabelText } = render(<GoalItem goal={goal} />)

    fireEvent.click(getByLabelText('Delete goal'))

    expect(deleteGoal).toHaveBeenCalledWith('goal-1')
    expect(dispatch).toHaveBeenCalledWith({ type: 'goals/delete' })
  })

  test('updates a goal from edit mode', async () => {
    const { getByDisplayValue, getByLabelText } = render(<GoalItem goal={goal} />)

    fireEvent.click(getByLabelText('Edit goal'))
    fireEvent.change(getByDisplayValue('Original goal'), {
      target: { value: '  Updated goal  ' },
    })
    await act(async () => {
      fireEvent.click(getByLabelText('Save goal'))
      await Promise.resolve()
    })

    expect(updateGoal).toHaveBeenCalledWith({
      id: 'goal-1',
      goalData: { text: 'Updated goal' },
    })
    expect(dispatch).toHaveBeenCalledWith({ type: 'goals/update' })
  })

  test('shows an error when saving blank goal text', () => {
    const { getByDisplayValue, getByLabelText } = render(<GoalItem goal={goal} />)

    fireEvent.click(getByLabelText('Edit goal'))
    fireEvent.change(getByDisplayValue('Original goal'), {
      target: { value: '   ' },
    })
    fireEvent.click(getByLabelText('Save goal'))

    expect(toast.error).toHaveBeenCalledWith('Please add a goal')
    expect(updateGoal).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })
})
