import { useSelector } from 'react-redux'
import { singletonHook } from 'react-singleton-hook'

const initSocket = null
export const useSocket = singletonHook(initSocket, () => {
  const socketInitialized = useSelector(state => state.shared.socketInitialized)
  const socket = useSelector(state => state.shared.socket)
  if (!socketInitialized) return initSocket

  return socket
})
