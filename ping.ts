import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { getLocation } from 'src/libs/location'
import { Eventful } from 'types'
import { api, useSocket } from './api'
import { extend } from './log'
import { useSession } from './session'

const log = extend('elib/ping')

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

  const { useOn, socket, connected } = useSocket()
  const { session } = useSession()

  useOn('ping:add', (ping: Eventful.API.PingGet) => {
    qc.setQueriesData<Eventful.API.PingGet[]>(['pings'], (old) =>
      old ? [...old.filter((ping2) => ping2._id !== ping._id), ping] : undefined
    )
  })

  useOn('ping:delete', (ping: Eventful.ID) => {
    qc.setQueriesData<Eventful.API.PingGet[]>(['pings'], (old) =>
      old ? old.filter((ping2) => ping2._id !== ping) : undefined
    )
  })

  useEffect(() => {
    if (socket && connected && session) {
      socket.emit('user:join', session._id)
      socket.emit('tag:join', session._id)
    }
    return () => {
      if (socket) {
        socket.emit('user:leave')
        socket.emit('tag:leave')
      }
    }
  }, [socket, connected, session])

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

// quick pings

export const pingOnMyWay = async (source: Eventful.ID) => {
  const sourcePing = await api.get<Eventful.API.PingGet>(`pings/${source}`).then((res) => res.data)
  if (!sourcePing) {
    return 'api-fail'
  }
  // const location = await getLocation()
  // if (!location) {
  //   return 'denied'
  // }
  const ping = await api
    .post('pings/add', {
      label: 'On my way',
      type: 'going',
      tags: [],
      location: {
        ...sourcePing.location,
      },
    } as Eventful.API.PingAdd)
    .then((res) => res.data)
  if (!ping) {
    return 'api-fail'
  }
  return 'success'
}

export const pingAskReply = async (
  source: Eventful.ID,
  replyMessage = '',
  useMyLocation = false
) => {
  const sourcePing = await api.get<Eventful.API.PingGet>(`pings/${source}`).then((res) => res.data)
  if (!sourcePing) {
    return 'api-fail'
  }
  const location = sourcePing.location
  if (useMyLocation) {
    const loc = await getLocation()
    if (loc) {
      location.coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
    }
  }
  const ping = await api
    .post('pings/add', {
      label: replyMessage,
      type: 'ping',
      tags: [],
      location: {
        ...sourcePing.location,
      },
    } as Eventful.API.PingAdd)
    .then((res) => res.data)
  if (!ping) {
    return 'api-fail'
  }
  return 'success'
}
