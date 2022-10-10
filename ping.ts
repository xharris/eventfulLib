import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Eventful } from 'types'
import { api } from './api'

export const usePings = ({
  tags,
  scope,
}: { tags?: Eventful.ID[]; scope?: Eventful.Ping['scope'] } = {}) => {
  const { data, ...query } = useQuery<Eventful.API.PingGet[]>(['ping'], () =>
    api.get('pings').then((res) => res.data)
  )
  const qc = useQueryClient()

  const addPing = useMutation((body: Eventful.API.PingAdd) => api.post('pings', body), {
    onSuccess: (res) => {
      qc.invalidateQueries(['ping'])
    },
  })

  const deletePing = useMutation((id: Eventful.ID) => api.delete(`pings/${id}`), {
    onSuccess: (res) => {
      qc.invalidateQueries(['ping'])
    },
  })

  const filtered = useMemo(
    () =>
      data?.filter(
        (ping) =>
          (!tags?.length || ping.tags.some((tag) => tags.includes(tag._id))) &&
          (!scope || ping.scope === scope)
      ),
    [data, tags, scope]
  )

  return {
    ...query,
    data: filtered,
    addPing: addPing.mutateAsync,
    deletePing: deletePing.mutateAsync,
  }
}
