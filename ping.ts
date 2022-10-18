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

export type FilteredPingGet = Eventful.API.PingGet & ReturnType<typeof extractDetails>

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
      data
        ?.filter(
          (ping) =>
            (!tags?.length || ping.tags.some((tag) => tags.includes(tag._id))) &&
            (!scope || ping.scope === scope)
        )
        .map((ping) => ({
          ...ping,
          ...extractDetails(ping.label ?? ''),
        })) ?? [],
    [data, tags, scope]
  )

  return {
    ...query,
    data: filtered,
    addPing: addPing.mutateAsync,
    deletePing: deletePing.mutateAsync,
  }
}

const relist = {
  phone: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/gi,
  url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/gi,
}

export const extractDetails = (label: string) => {
  const details: Record<string, string[]> = {}
  Object.entries(relist).forEach(([category, re]) => {
    if (!details[category]) {
      details[category] = []
    }
    let match
    while ((match = re.exec(label)) !== null) {
      if (!details[category].includes(match[0])) {
        details[category].push(match[0])
      }
      label = label.replaceAll(match[0], '')
    }
  })
  return {
    label: label.trim(),
    details: details as Record<keyof typeof relist, string[]>,
  }
}
