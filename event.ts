import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect } from 'react'
import { Eventful } from 'types'
import { api, useSocket } from './api'
import { scheduleNotifications } from './notification'

export const useEvents = () => {
  const query = useQuery<Eventful.API.EventGet[]>(['events'], () =>
    api.get('events').then((res) => res.data)
  )

  const qc = useQueryClient()

  const muCreateEvent = useMutation(
    (body: Eventful.API.EventAdd) => api.post<Eventful.API.EventGet>('events/add', body),
    {
      onSuccess: () => {
        qc.invalidateQueries(['events'])
      },
    }
  )

  useEffect(() => {
    if (query.data) {
      const now = moment()
      scheduleNotifications(
        query.data
          .filter((event) => event.time.start && moment(event.time.start.date).isSameOrAfter(now))
          .map(
            (event) =>
              ({
                expo: {
                  identifier: event._id,
                  content: {
                    title: event.name,
                  },
                  trigger: {
                    minute: moment(event.time.start?.date).subtract(1, 'h').diff(new Date(), 'm'),
                  },
                },
              } as Eventful.LocalNotification)
          )
      )
    }
  }, [query])

  return {
    ...query,
    createEvent: muCreateEvent.mutateAsync,
  }
}

export const useEvent = ({ id }: { id?: Eventful.ID | string }) => {
  const query = useQuery<Eventful.API.EventGet>(
    ['event', { id }],
    () => api.get(`event/${id}`).then((res) => res.data),
    { enabled: !!id }
  )
  const qc = useQueryClient()
  const { useOn } = useSocket()

  useOn(
    'plan:add',
    (plan: Eventful.API.PlanGet) => {
      qc.setQueriesData<Eventful.API.EventGet>(['event', { id }], (old) =>
        old
          ? {
              ...old,
              plans: [plan, ...old.plans.filter((pln) => pln._id !== plan._id)],
            }
          : undefined
      )
    },
    [qc, id]
  )

  useOn(
    'plan:edit',
    (plan: Eventful.API.PlanGet) => {
      qc.setQueriesData<Eventful.API.EventGet>(['event', { id }], (old) =>
        old
          ? {
              ...old,
              plans: [plan, ...old.plans.filter((pln) => pln._id !== plan._id)],
            }
          : undefined
      )
    },
    [qc, id]
  )

  useOn(
    'plan:delete',
    (plan: Eventful.API.PlanGet) => {
      qc.setQueriesData<Eventful.API.EventGet>(['event', { id }], (old) =>
        old
          ? {
              ...old,
              plans: old.plans.filter((pln) => pln._id !== plan._id),
            }
          : undefined
      )
    },
    [qc, id]
  )

  const muUpdateEvent = useMutation(
    (body: Eventful.API.EventUpdate) => api.put(`event/${id}`, body),
    {
      onSuccess: () => {
        qc.invalidateQueries(['events'])
        qc.invalidateQueries(['event', { id }])
      },
    }
  )

  const muDeleteEvent = useMutation(() => api.delete(`event/${id}`), {
    onSuccess: () => {
      qc.invalidateQueries(['events'])
      qc.invalidateQueries(['event', { id }])
    },
  })

  return {
    ...query,
    updateEvent: muUpdateEvent.mutateAsync,
    deleteEvent: muDeleteEvent.mutateAsync,
  }
}
