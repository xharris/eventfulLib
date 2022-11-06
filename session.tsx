import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { Eventful } from 'types'
import { api } from './api'
import { AxiosResponse } from 'axios'
import { extend } from './log'
// import { setItem } from '../libs/storage'

const log = extend('elib/session')

const Context = createContext<{
  session?: Eventful.User
  isFetching: boolean
  checkAuth: () => Promise<void>
  logIn: (body: Eventful.API.LogInOptions) => Promise<AxiosResponse<any, any>>
  signUp: (body: Eventful.API.SignUpOptions) => Promise<AxiosResponse<any, any>>
  logOut: () => Promise<any>
}>({
  isFetching: true,
  checkAuth: () => Promise.resolve(),
  logIn: () => Promise.resolve(null as unknown as AxiosResponse<any, any>),
  signUp: () => Promise.resolve(null as unknown as AxiosResponse<any, any>),
  logOut: () => Promise.resolve(),
})

export const SessionProvider = ({
  allowAnonymous,
  children,
}: {
  allowAnonymous?: boolean
  children?: ReactNode
}) => {
  const [session, setSession] = useState<Eventful.User>()
  const [isFetching, setIsFetching] = useState(true)

  const checkAuth = useCallback(() => {
    setIsFetching(true)
    return api
      .get('auth', {
        timeout: 2000,
      })
      .then((res) => {
        setSession(res.data)
      })
      .catch((err) => {
        log.error(err.message)
        setSession(undefined)
      })
      .finally(() => {
        setIsFetching(false)
      })
  }, [allowAnonymous])

  const logIn = (body: Eventful.API.LogInOptions) => {
    return api.post('login', body).then(async (res) => {
      res.status < 300 && setSession(res.data)
      // setItem('deviceId', res.data.deviceId)
      return res
    })
  }
  // .catch(console.log)
  const signUp = (body: Eventful.API.SignUpOptions) => {
    return api.post('signup', body).then(async (res) => {
      res.status < 300 && setSession(res.data)
      // setItem('deviceId', res.data.deviceId)
      return res
    })
  }
  // .catch(console.log)
  const logOut = () =>
    api
      .delete('fcm')
      .then(() => api.get('logout'))
      .then(() => setSession(undefined))

  return (
    <Context.Provider
      value={{
        session,
        isFetching,
        checkAuth,
        logIn,
        signUp,
        logOut,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSession = (verify: boolean = false) => {
  const { checkAuth, ...ctx } = useContext(Context)

  useEffect(() => {
    let ignore = false
    if (verify && !ignore) {
      checkAuth().catch()
    }
    return () => {
      ignore = true
    }
  }, [verify])

  return { checkAuth, ...ctx }
}
