import axios from 'axios'
import { createContext, DependencyList, ReactNode, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from 'types'
import { extend } from './log'
import { NODE_ENV, IS_MOBILE, REACT_APP_API_URL, REACT_APP_SOCKET_URL } from 'src/libs/config'

const log = extend('elib/api')

const API_URL = process.env.REACT_APP_API_URL
const baseURL =
  NODE_ENV === 'production' && !IS_MOBILE
    ? `${window.location.protocol}//${window.location.host}${API_URL ?? '/api'}`
    : API_URL

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

log.info(`using ${baseURL}`)

type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any],
  TReturnType = ReturnType<TFunction>
> = (...args: [...Parameters<TFunction>, ...TParameters]) => TReturnType

type useOnHook = AddParameters<
  Socket<ServerToClientEvents, ClientToServerEvents>['on'],
  [deps?: DependencyList],
  void
>

const Context = createContext<{
  socket?: Socket<ServerToClientEvents, ClientToServerEvents>
  connected: boolean
  useOn: useOnHook
}>({
  socket: undefined,
  connected: false,
  useOn: () => null,
})

export const ApiProvider = ({ children }: { children?: ReactNode }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents>>()
  const [connected, setConnected] = useState(false)
  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL

  useEffect(() => {
    log.info(`websocket init=${!!socket} connected=${connected}`)
  }, [socket, connected])

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: IS_MOBILE ? ['websocket'] : undefined,
    })
    setSocket(newSocket)

    return () => {
      newSocket.close()
      setSocket(undefined)
      setConnected(false)
    }
  }, [])

  useEffect(() => {
    socket?.on('connect', () => {
      setConnected(true)
    })
    socket?.on('disconnect', () => {
      setConnected(false)
    })
    socket?.on('connect_error', (e) =>
      log.error(
        `[Socket.IO] ${e.message} ${JSON.stringify(e)} (${SOCKET_URL}, websocket: ${IS_MOBILE})`
      )
    )

    return () => {
      socket?.off('connect')
      socket?.off('disconnect')
    }
  }, [socket])

  const useOn: useOnHook = (ev, listener, deps) => {
    useEffect(() => {
      socket?.on<typeof ev>(ev, listener)

      return () => {
        socket?.off(ev)
      }
    }, [connected, socket, ev, listener, deps])
  }

  return (
    <Context.Provider
      value={{
        socket,
        connected,
        useOn,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSocket = () => useContext(Context)
// io(process.env.REACT_APP_SOCKET_URL ?? '/')
