import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconType } from 'react-icons'
import { FiFile, FiHome, FiMapPin, FiTruck } from 'react-icons/fi'
import { TbCar } from 'react-icons/tb'
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
  icon: IconType
  placeholder: Partial<Record<keyof Eventful.API.PlanAdd, string>>
  fields: Partial<Record<keyof Eventful.API.PlanAdd, boolean>>
}

export const CATEGORY_INFO: Record<number, CategoryInfo> = {
  0: {
    label: 'Empty',
    icon: FiFile,
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
    icon: FiHome,
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
    icon: TbCar,
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
    icon: FiMapPin,
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
      onSuccess: () => {
        qc.invalidateQueries(['event', { id: event }])
      },
    }
  )

  const muDeletePlan = useMutation((id: Eventful.ID) => api.delete(`plan/${id}`), {
    onSuccess: () => {
      qc.invalidateQueries(['event', { id: event }])
    },
  })

  return {
    addPlan: muAddPlan.mutateAsync,
    updatePlan: muUpdatePlan.mutateAsync,
    deletePlan: muDeletePlan.mutateAsync,
  }
}
