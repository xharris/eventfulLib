import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Eventful } from 'types'
import { api } from './api'

export interface UsePingsProps {
  tags?: Eventful.ID[]
  scope?: Eventful.Ping['scope']
  beforeTime?: Date
  afterTime?: Date
}

export const usePings = ({ tags, scope, ...options }: UsePingsProps = {}) => {
  const { data, ...query } = useQuery<Eventful.API.PingGet[]>(['pings', options], () =>
    api.post('pings', options).then((res) => res.data)
  )
  const qc = useQueryClient()

  const addPing = useMutation((body: Eventful.API.PingAdd) => api.post('pings/add', body), {
    onSuccess: (res) => {
      qc.invalidateQueries(['pings'])
    },
  })

  const deletePing = useMutation((id: Eventful.ID) => api.delete(`pings/${id}`), {
    onSuccess: (res) => {
      qc.invalidateQueries(['pings'])
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

  useEffect(() => {
    console.log(JSON.stringify(data), scope)
  }, [data, scope])

  return {
    ...query,
    data: filtered,
    addPing: addPing.mutateAsync,
    deletePing: deletePing.mutateAsync,
  }
}
