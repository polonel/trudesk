import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { MESSAGES_UI_SPAWN_CHAT_WINDOW } from 'serverSocket/socketEventConsts'

export default function SpawnChatWindowSocket (props) {
  const socket = useSelector(state => state.shared.socket)

  useEffect(() => {
    // socket.off(MESSAGES_UI_SPAWN_CHAT_WINDOW, onSpawnChatWindow)
    // socket.on(MESSAGES_UI_SPAWN_CHAT_WINDOW, onSpawnChatWindow)

    return function cleanup () {
      if (socket) socket.off(MESSAGES_UI_SPAWN_CHAT_WINDOW, onSpawnChatWindow)
    }
  }, [socket])

  const onSpawnChatWindow = data => {
    console.log(data)
  }

  return <div />
}
