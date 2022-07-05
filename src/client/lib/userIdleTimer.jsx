import React from 'react'
import { useSelector } from 'react-redux'
import { useIdleTimer } from 'react-idle-timer'

import { UI_ONLINE_STATUS_SET } from 'serverSocket/socketEventConsts'

const UserIdleTimer = () => {
  const socket = useSelector(state => state.shared.socket)

  const onIdle = () => {
    if (socket) {
      socket.emit(UI_ONLINE_STATUS_SET, { state: 'idle' })
    }
  }

  const onActive = () => {
    if (socket) {
      socket.emit(UI_ONLINE_STATUS_SET, { state: 'active' })
    }
  }

  // React Idle Timer
  useIdleTimer({ timeout: 5 * 60 * 1000, onIdle, onActive })

  return <div />
}

export default UserIdleTimer
