import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { FaEdit, FaSave, FaTimes, FaTrash } from 'react-icons/fa'
import { deleteGoal, updateGoal } from '../features/goals/goalSlice'

function GoalItem({ goal }) {
  const dispatch = useDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(goal.text)

  const onCancel = () => {
    setText(goal.text)
    setIsEditing(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    const goalText = text.trim()

    if (!goalText) {
      toast.error('Please add a goal')
      return
    }

    try {
      await dispatch(
        updateGoal({ id: goal._id, goalData: { text: goalText } })
      ).unwrap()
      setIsEditing(false)
    } catch (error) {
      toast.error(error)
    }
  }

  return (
    <div className='goal'>
      <div>{new Date(goal.createdAt).toLocaleString('en-US')}</div>
      {isEditing ? (
        <form onSubmit={onSubmit} className='goal-edit-form'>
          <input
            type='text'
            name='goalText'
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className='goal-actions'>
            <button type='submit' className='icon-btn' aria-label='Save goal'>
              <FaSave />
            </button>
            <button
              type='button'
              onClick={onCancel}
              className='icon-btn'
              aria-label='Cancel edit'
            >
              <FaTimes />
            </button>
          </div>
        </form>
      ) : (
        <>
          <h2>{goal.text}</h2>
          <div className='goal-actions'>
            <button
              type='button'
              onClick={() => setIsEditing(true)}
              className='icon-btn'
              aria-label='Edit goal'
            >
              <FaEdit />
            </button>
            <button
              type='button'
              onClick={() => dispatch(deleteGoal(goal._id))}
              className='icon-btn'
              aria-label='Delete goal'
            >
              <FaTrash />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default GoalItem
