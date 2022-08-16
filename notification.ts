import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eventful } from 'types'
import { api, useSocket } from './api'
import { useSession } from './session'
// import { initializeApp } from 'firebase/app'
// import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// const fbaseConfig = new URLSearchParams({
//   REACT_APP_VAPID_KEY:
//     'BOsvUqDTpR9npcwBxTCO2UGGQbOgt2sG2O9oUKubQhQw8mGqC8Leh-ihNSjhvqG_9q-jYfthin5Vw8PdCYOEBBk',
//   REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
// }).toString()

// export { getToken } from 'firebase/messaging'

// const app = initializeApp({
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   appId: '1:79944665764:web:cc722d5d8f9ca080bfb431',
//   projectId: 'eventful-870ba',
//   authDomain: 'eventful-870ba.firebaseapp.com',
//   storageBucket: 'eventful-870ba.appspot.com',
//   messagingSenderId: '79944665764',
// })
// const messaging = getMessaging(app)

const requestPermission = () =>
  new Promise<void>((res, rej) => {
    Notification.requestPermission().then((permission) => {
      if (permission !== 'granted') {
        return rej()
      }
      return res()
      // try {
      //   navigator.serviceWorker
      //     .register(`firebase-messaging-sw.js?${fbaseConfig}`, {
      //       scope: '/',
      //       updateViaCache: 'none',
      //     })
      //     .then((registration) =>
      //       getToken(messaging, {
      //         vapidKey:
      //           'BOsvUqDTpR9npcwBxTCO2UGGQbOgt2sG2O9oUKubQhQw8mGqC8Leh-ihNSjhvqG_9q-jYfthin5Vw8PdCYOEBBk'
      //       })
      //     )
      //     .then((token) => {
      //       console.log('token', token)
      //       if (!token) {
      //         return rej()
      //       }
      //       api.post('fcm', { token }).then(() => {
      //         res()
      //       })
      //     })
      // } catch (e) {
      //   if (e instanceof Error) {
      //     console.log(e.message)
      //   }
      //   return rej()
      // }
    })
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
      requestPermission()
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
        new Notification(payload.notification.title ?? '', {
          body: payload.notification.body,
        })
      }
    },
    [session]
  )

  // uncomment when I figure out FCM Push Notifs
  // useEffect(() => {
  //   const unsub = onMessage(messaging, (payload) => {
  //     console.log('foreground message', payload)
  //   })
  //   return () => {
  //     unsub()
  //   }
  // }, [])

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
