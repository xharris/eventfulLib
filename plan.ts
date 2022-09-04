import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'

export const CATEGORY = {
  None: 0,
  Lodging: 1,
  Carpool: 2,
  Meet: 3,
}

export interface CategoryInfo {
  label: string
  placeholder: Partial<Record<keyof Eventful.API.PlanAdd, string>>
  fields: Partial<Record<keyof Eventful.API.PlanAdd, boolean>>
}

export const CATEGORY_INFO: Record<number, CategoryInfo> = {
  0: {
    label: 'Empty',
    placeholder: {
      what: 'Name',
      location: 'Location',
      time: 'Time',
      who: 'People',
    },
    fields: {
      what: true,
      time: true,
      location: true,
      who: true,
    },
  },
  1: {
    label: 'Lodging',
    placeholder: {
      location: 'Where to stay?',
    },
    fields: {
      location: true,
      who: true,
      time: true,
    },
  },
  2: {
    label: 'Carpool',
    placeholder: {
      what: 'Who is driving?',
    },
    fields: {
      what: true,
      who: true,
    },
  },
  3: {
    label: 'Location',
    placeholder: {
      what: 'Where are you going?',
    },
    fields: {
      location: true,
      time: true,
    },
  },
  // 4: {
  //   label: 'Flight',
  //   icon: FiMapPin,
  //   placeholder: {
  //     what: 'Flight Number',
  //   },
  //   fields: {
  //     what: true,
  //     who: true,
  //   },
  // }
}

export const getTitle = (plan: Eventful.Plan) =>
  plan.category === CATEGORY.Carpool
    ? `${plan.what} carpool`
    : plan.category === CATEGORY.Lodging || plan.category === CATEGORY.Meet
    ? plan.location?.label ?? plan.location?.address
    : !!plan.what?.length
    ? plan.what
    : 'Untitled plan'

export const usePlans = ({ event }: { event?: Eventful.ID }) => {
  const qc = useQueryClient()

  const muAddPlan = useMutation(
    (body: Eventful.API.PlanAdd) => api.post<Eventful.Plan>(`event/${event}/plans/add`, body),
    {
      onSuccess: () => {
        qc.invalidateQueries(['event', { id: event }])
      },
    }
  )

  const muUpdatePlan = useMutation(
    (body: Eventful.API.PlanEdit) => api.put<Eventful.Plan>(`plan/${body._id}`, body),
    {
      onSuccess: (res) => {
        qc.invalidateQueries(['event', { id: event }])
        qc.invalidateQueries(['plan', { id: res.data._id }])
      },
    }
  )

  const muDeletePlan = useMutation((id: Eventful.ID) => api.delete(`plan/${id}`), {
    onSuccess: (res) => {
      qc.invalidateQueries(['event', { id: event }])
    },
  })

  return {
    addPlan: muAddPlan.mutateAsync,
    updatePlan: muUpdatePlan.mutateAsync,
    deletePlan: muDeletePlan.mutateAsync,
  }
}

export const usePlan = ({ plan }: { plan?: Eventful.ID }) => {
  const query = useQuery<Eventful.API.PlanGet>(
    ['plan', { id: plan }],
    () => api.get(`plan/${plan}`).then((res) => res.data),
    {
      enabled: !!plan,
    }
  )
  const qc = useQueryClient()

  const muUpdatePlan = useMutation(
    (body: Eventful.API.PlanEdit) => api.put<Eventful.Plan>(`plan/${body._id}`, body),
    {
      onSuccess: (res) => {
        qc.invalidateQueries(['events'])
        qc.invalidateQueries(['event', { id: res.data.event }])
        qc.invalidateQueries(['plan', { id: res.data._id }])
      },
    }
  )

  const muDeletePlan = useMutation((id: Eventful.ID) => api.delete(`plan/${id}`), {
    onSuccess: (res) => {
      qc.invalidateQueries(['events'])
      qc.invalidateQueries(['event', { id: res.data.event }])
    },
  })

  return {
    ...query,
    updatePlan: muUpdatePlan.mutateAsync,
    deletePlan: muDeletePlan.mutateAsync,
  }
}
