import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

// Module-level singleton — one connection for the entire PWA session.
let singleton: Socket | null = null

function getOrCreateSocket(): Socket {
  if (!singleton) {
    singleton = io('/', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      // Do NOT pass token in query — rely on _rft_ httpOnly cookie only.
      withCredentials: true,
    })
  }
  return singleton
}

export function useSocket() {
  const queryClient = useQueryClient()

  // Initialise with the existing singleton so components that mount after
  // the first connection get a non-null value on their very first render.
  const [socket, setSocket] = useState<Socket | null>(singleton)

  useEffect(() => {
    const s = getOrCreateSocket()

    // If this component mounted before the singleton existed, update state
    // so it (and any children) receive the socket reference.
    if (!socket) setSocket(s)

    const handleConnect = () => {
      queryClient.invalidateQueries()
    }

    s.on('connect', handleConnect)

    return () => {
      s.off('connect', handleConnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient])

  return socket
}
