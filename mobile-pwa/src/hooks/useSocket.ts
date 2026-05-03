import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

let socket: Socket | null = null

export function useSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!socket) {
      socket = io('/', {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        // Do NOT pass token in query — use _rft_ cookie only
      })
    }

    socketRef.current = socket

    socket.on('connect', () => {
      queryClient.invalidateQueries()
    })

    socket.on('disconnect', () => {
      // offline banner handled by components subscribing to socket state
    })

    return () => {
      socket?.off('connect')
      socket?.off('disconnect')
    }
  }, [queryClient])

  return socketRef.current
}
