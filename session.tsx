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
              console.log('session:res', res)
              setSession(res.data)
            })
            .catch((err) => {
              console.log('session:err', err)
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
    api.post('login', body).then((res) => setSession(res.data))
  const signUp = (body: Eventful.API.SignUpOptions) =>
    api.post('signup', body).then((res) => setSession(res.data))
  const logOut = () => api.get('logout').then(() => setSession(null))

  return {
    session,
    logIn,
    signUp,
    logOut,
  }
}
