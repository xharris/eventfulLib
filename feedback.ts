import { Eventful } from 'types'
import { api } from './api'

export const FEEDBACK: Record<string, { label: string }> = {
  question: {
    label: 'Question',
  },
  suggestion: {
    label: 'Suggestion/Request',
  },
  bug: {
    label: 'Issue/Bug',
  },
  other: {
    label: 'Something else',
  },
}

export const useFeedback = () => {
  const sendFeedback = (body: Eventful.API.FeedbackEdit) => api.post('feedback', body)

  return {
    sendFeedback,
  }
}
