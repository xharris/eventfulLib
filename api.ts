import axios, { AxiosInstance } from 'axios'
import {
  Context,
  createContext,
  DependencyList,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from 'types'
import { useSnackbar } from '../components/Snackbar'
import config from '../libs/config'

const { NODE_ENV, REACT_APP_API_URL, IS_MOBILE, REACT_APP_SOCKET_URL } = config

export const api = axios.create({
  baseURL:
    NODE_ENV === 'production' && !IS_MOBILE && window
      ? `${window.location.protocol}//${window.location.host}${REACT_APP_API_URL}`
      : REACT_APP_API_URL,
  withCredentials: true,
})

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
    const newSocket = io(REACT_APP_SOCKET_URL ?? '/', {
      transports: IS_MOBILE ? ['websocket'] : undefined,
    })
    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    socket?.on('connect', () => {
      setConnected(true)
    })
    socket?.on('disconnect', () => {
      setConnected(false)
    })
    socket?.on('connect_error', (e) => console.log(`[Socket.IO] ${e.message}`))

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
