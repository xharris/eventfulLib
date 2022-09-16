import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'
import { useSession } from './session'

export const UNIT_LABEL = {
  m: 'minute',
  h: 'hour',
  d: 'day',
  w: 'week',
  M: 'month',
}

export const useReminders = () => {
  const { session } = useSession()
  const query = useQuery(
    ['reminders'],
    () => api.get<Eventful.Reminder[]>(`user/${session?._id}/reminders`).then((res) => res.data),
    { enabled: !!session }
  )
  const qc = useQueryClient()

  const addReminder = useMutation(
    (reminder: Eventful.API.ReminderEdit) => api.post(`user/${session?._id}/reminders`, reminder),
    {
      onSuccess: () => {
        qc.invalidateQueries(['reminders'])
      },
    }
  )
  const setReminder = useMutation(
    (reminder: Eventful.API.ReminderEdit) =>
      api.put(`user/${session?._id}/reminders/${reminder._id}`, reminder),
    {
      onSuccess: () => {
        qc.invalidateQueries(['reminders'])
      },
    }
  )
  const deleteReminder = useMutation((id: Eventful.ID) =>
    api.delete(`user/${session?._id}/reminders/${id}`)
  )

  return {
    ...query,
    addReminder: addReminder.mutateAsync,
    setReminder: setReminder.mutateAsync,
    deleteReminder: deleteReminder.mutateAsync,
  }
}
