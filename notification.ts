import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eventful } from 'types'
import {
  cancelAllScheduledNotifications,
  requestPermission,
  scheduleNotification,
  showLocalNotification,
  useMessaging,
} from '../libs/notification'
import { api, useSocket } from './api'
import { extend } from './log'
import { useSession } from './session'

const log = extend('elib/notification')

export const request = () =>
  new Promise<void>((res, rej) => {
    requestPermission()
      .then((allowed) => {
        if (allowed) {
          return res()
        }
        return rej('Notifications not allowed')
      })
      .catch(log.error)
  })

const useFocused = () => {
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    const handleFocus = () => setFocused(true)

    const handleBlur = () => setFocused(false)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])
  return focused
}

export const useNotification = ({
  ref,
  refModel,
  key,
}: Partial<Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>>) => {
  const query = useQuery(
    ['notifications'],
    () =>
      api
        .get<Eventful.NotificationSetting[]>(`notifications/${refModel}/${ref}`)
        .then((res) => res.data),
    {
      enabled: !!(ref && refModel && key),
    }
  )
  const { data } = query
  const ns = useMemo(() => data?.find((ns) => ns.key === key), [data, key])
  const { socket, connected, useOn } = useSocket()
  const { session } = useSession()

  useEffect(() => {
    if (ns) {
      request()
    }
  }, [ns])

  useEffect(() => {
    if (connected && socket && ref && refModel && key) {
      if (ns) {
        socket.emit('room:join', { refModel, ref, key })
      } else {
        socket.emit('room:leave', { refModel, ref, key })
      }
    }
    return () => {
      if (connected && socket && ref && refModel && key) {
        socket.emit('room:leave', { refModel, ref, key })
      }
    }
  }, [refModel, ref, key, connected, socket, ns])

  useOn(
    'notification',
    (payload: Eventful.NotificationPayload) => {
      if (payload.notification && payload.data?.createdBy !== session?._id) {
        showLocalNotification(payload)
      }
    },
    [session]
  )

  return {
    ...query,
  }
}

export const useNotifications = () => {
  const query = useQuery(['notifications'], () =>
    api.get<Eventful.NotificationSetting[]>(`notifications/settings`).then((res) => res.data)
  )
  const { data } = query
  const qc = useQueryClient()
  useMessaging()

  const isEnabled = useCallback(
    ({
      key,
      refModel,
      ref,
    }: Partial<Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>>) =>
      data?.some((ns) => ns.key === key && ns.refModel === refModel && ns.ref === ref),
    [data]
  )

  const muEnable = useMutation(
    ({ key, refModel, ref }: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>) =>
      api.get(`/notifications/${refModel}/${ref}/${key}/enable`),
    {
      onSuccess: () => {
        qc.invalidateQueries(['notifications'])
      },
    }
  )

  const muDisable = useMutation(
    ({ key, refModel, ref }: Pick<Eventful.NotificationSetting, 'key' | 'refModel' | 'ref'>) =>
      api.get(`/notifications/${refModel}/${ref}/${key}/disable`),
    {
      onSuccess: () => {
        qc.invalidateQueries(['notifications'])
      },
    }
  )

  return {
    ...query,
    isEnabled,
    enable: muEnable.mutateAsync,
    disable: muDisable.mutateAsync,
  }
}

export const scheduleNotifications = async (notifications: Eventful.LocalNotification[]) => {
  await cancelAllScheduledNotifications()
  await Promise.all(notifications.map((notif) => scheduleNotification(notif)))
}
