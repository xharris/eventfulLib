import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'

export const usePings = () => {
  const query = useQuery<Eventful.API.PingGet[]>(['ping'], () =>
    api.get('pings').then((res) => res.data)
  )
  const qc = useQueryClient()

  const muAddPlan = useMutation((body: Eventful.API.PingAdd) => api.post('ping', body), {
    onSuccess: (res) => {
      qc.invalidateQueries(['ping'])
    },
  })

  return {
    ...query,
    addPlan: muAddPlan.mutateAsync,
  }
}
