import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Eventful } from 'types'
import { api } from './api'
import createStateContext from 'react-use/lib/factory/createStateContext'

const [useSessionCtx, Provider] = createStateContext<Eventful.User | null>(null)

export const SessionProvider = Provider

export const useSession = (verify: boolean = false) => {
  const [session, setSession] = useSessionCtx()

  const checkAuth = useCallback(
    () =>
      verify
        ? api
            .get('auth')
            .then((res) => {
              setSession(res.data)
            })
            .catch((err) => {
              setSession(null)
            })
        : Promise.resolve(),
    [verify]
  )

  useEffect(() => {
    let ignore = false
    if (verify && !ignore) {
      checkAuth()
    }
    return () => {
      ignore = true
    }
  }, [verify])

  const logIn = (body: Eventful.API.LogInOptions) =>
    api.post('login', body).then((res) => {
      res.status < 300 && setSession(res.data)
      return res
    })
  // .catch(console.log)
  const signUp = (body: Eventful.API.SignUpOptions) =>
    api.post('signup', body).then((res) => {
      res.status < 300 && setSession(res.data)
      return res
    })
  // .catch(console.log)
  const logOut = () => api.get('logout').then(() => setSession(null))

  return {
    session,
    logIn,
    signUp,
    logOut,
  }
}
