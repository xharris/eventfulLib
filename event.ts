import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api, useSocket } from './api'

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

  return {
    ...query,
    updateEvent: muUpdateEvent.mutateAsync,
  }
}
