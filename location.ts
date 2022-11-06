import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'
import { extend } from './log'

const log = extend('elib/location')

// export const LOCATION_TYPES = ['food', 'fun'] as Eventful.Location['type'][]

export const useLocations = () => {
  const query = useQuery<Eventful.API.LocationGet[]>(['locations'], () =>
    api.get('locations').then((res) => res.data)
  )
  const qc = useQueryClient()

  const addLocation = useMutation(
    (body: Eventful.API.LocationAdd) => api.post('locations/add', body),
    {
      onSuccess: () => {
        qc.invalidateQueries(['locations'])
      },
    }
  )

  const updateLocation = useMutation(
    (body: Eventful.API.LocationEdit & { _id: Eventful.ID }) =>
      api.put(`locations/${body._id}`, body),
    {
      onSuccess: () => {
        qc.invalidateQueries(['locations'])
      },
    }
  )

  const deleteLocation = useMutation((id: Eventful.ID) => api.delete(`locations/${id}`), {
    onSuccess() {
      qc.invalidateQueries(['locations'])
    },
  })

  return {
    ...query,
    addLocation: addLocation.mutateAsync,
    updateLocation: updateLocation.mutateAsync,
    deleteLocation: deleteLocation.mutateAsync,
  }
}
