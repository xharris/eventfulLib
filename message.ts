import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Eventful } from 'types'
import { api, useSocket } from './api'
import { useSession } from './session'

export const useMessages = ({ event }: { event?: Eventful.ID }) => {
  const query = useQuery<Eventful.API.MessageGet[]>(
    ['messages', { event }],
    () => api.get(`event/${event}/messages`).then((res) => res.data),
    {
      enabled: !!event,
      staleTime: Infinity,
    }
  )
  const qc = useQueryClient()

  const { session } = useSession()
  const { socket, connected, useOn } = useSocket()

  useOn(
    'message:add',
    (message: Eventful.API.MessageGet) => {
      qc.setQueriesData<Eventful.API.MessageGet[]>(['messages', { event }], (old = []) => [
        message,
        ...old.filter((msg) => msg._id !== message._id),
      ])
    },
    [qc, event]
  )

  useOn(
    'message:edit',
    (message: Eventful.API.MessageGet) => {
      qc.setQueriesData<Eventful.API.MessageGet[]>(['messages', { event }], (old = []) =>
        old.map((message2) => (message._id === message2._id ? message : message2))
      )
    },
    [qc, event]
  )

  useOn(
    'message:delete',
    (id: Eventful.ID) => {
      qc.setQueriesData<Eventful.API.MessageGet[]>(['messages', { event }], (old = []) =>
        old.filter((message) => message._id !== id)
      )
    },
    [qc, event]
  )

  useEffect(() => {
    if (socket && connected && event && session) {
      socket.emit('event:join', event, session._id)
    }
    return () => {
      if (socket && event) {
        socket.emit('event:leave', event)
      }
    }
  }, [connected, event, session, socket])

  const muAddMessage = useMutation((body: Eventful.API.MessageAdd) =>
    api.post(`event/${event}/messages/add`, body)
  )

  const muUpdateMessage = useMutation((body: Eventful.API.MessageEdit) =>
    api.put(`message/${body._id}`, body)
  )

  const muDeleteMessage = useMutation((id: Eventful.ID) => api.delete(`message/${id}`))

  return {
    ...query,
    addMessage: muAddMessage.mutateAsync,
    updateMessage: muUpdateMessage.mutateAsync,
    deleteMessage: muDeleteMessage.mutateAsync,
  }
}
