import axios from 'axios'
import { DependencyList, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from 'types'
import { extend } from './log'
import { NODE_ENV, IS_MOBILE, REACT_APP_API_URL, REACT_APP_SOCKET_URL } from 'src/libs/config'

const log = extend('elib/api')

const baseURL =
  NODE_ENV === 'production' && !IS_MOBILE
    ? `${window.location.protocol}//${window.location.host}${REACT_APP_API_URL ?? '/api'}`
    : REACT_APP_API_URL

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

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents>>()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(REACT_APP_SOCKET_URL, {
      transports: IS_MOBILE ? ['websocket'] : undefined,
    })
    setSocket(newSocket)

    return () => {
      newSocket.close()
      setSocket(undefined)
    }
  }, [])

  useEffect(() => {
    socket?.on('connect', () => {
      setConnected(true)
    })
    socket?.on('disconnect', () => {
      setConnected(false)
    })
    socket?.on('connect_error', (e) => log.error(`[Socket.IO] ${e.message}`))

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

  return {
    socket,
    connected,
    useOn,
  }
}
// io(process.env.REACT_APP_SOCKET_URL ?? '/')
