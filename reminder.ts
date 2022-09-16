import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'
import { useEvents } from './event'
import { scheduleNotifications } from './notification'
import { useSession } from './session'
import moment from 'moment-timezone'
import { formatStart } from '../components/Time'
import { useEffect } from 'react'

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

  const addReminder = useMutation(() => api.post(`user/${session?._id}/reminders`), {
    onSuccess: () => {
      qc.invalidateQueries(['reminders'])
    },
  })
  const setReminder = useMutation(
    (reminder: Eventful.API.ReminderEdit) =>
      api.put(`user/${session?._id}/reminders/${reminder._id}`, reminder),
    {
      onSuccess: () => {
        qc.invalidateQueries(['reminders'])
      },
    }
  )
  const deleteReminder = useMutation(
    (id: Eventful.ID) => api.delete(`user/${session?._id}/reminders/${id}`),
    {
      onSuccess: () => {
        qc.invalidateQueries(['reminders'])
      },
    }
  )

  return {
    ...query,
    addReminder: addReminder.mutateAsync,
    setReminder: setReminder.mutateAsync,
    deleteReminder: deleteReminder.mutateAsync,
  }
}

export const _scheduleNotifications = (
  events: Eventful.API.EventGet[],
  reminders: Eventful.Reminder[]
) => {
  if (events) {
    const now = moment()
    return scheduleNotifications(
      events
        .filter((event) => event.time.start && moment(event.time.start.date).isSameOrAfter(now))
        .reduce(
          (notifs, event) =>
            notifs.concat(
              reminders
                ?.reduce((rems, reminder) => {
                  // add the notification if it's not already added
                  const newRem: Eventful.LocalNotification = {
                    expo: {
                      identifier: event._id,
                      content: {
                        title: event.name,
                        body: `${formatStart(event.time)} (${moment
                          .duration(reminder.amount, reminder.unit)
                          .humanize(true)})`,
                      },
                      trigger: {
                        seconds: moment(event.time.start?.date)
                          .subtract(reminder.amount, reminder.unit)
                          .diff(new Date(), 's'),
                      },
                    },
                  }
                  if (
                    !rems.some(
                      (rem) =>
                        rem.expo.identifier === newRem.expo.identifier &&
                        rem.expo.trigger.seconds === newRem.expo.trigger.seconds
                    )
                  ) {
                    rems.push(newRem)
                  }
                  return rems
                }, [] as Eventful.LocalNotification[])
                .filter((notif) => notif.expo.trigger.seconds > 0) ?? []
            ),
          [] as Eventful.LocalNotification[]
        )
    )
  }
}

export const useReminderScheduler = () => {
  const { data: reminders } = useReminders()
  const { data: events } = useEvents()

  useEffect(() => {
    if (reminders && events) {
      _scheduleNotifications(events, reminders)
    }
  }, [reminders, events])
}
