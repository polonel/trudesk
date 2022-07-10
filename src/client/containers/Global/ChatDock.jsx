import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'

import { MESSAGES_UI_SPAWN_CHAT_WINDOW } from 'serverSocket/socketEventConsts'
import { setSessionUser } from 'actions/common'

import ChatWindow from 'containers/Global/ChatWindow'

export default function ChatDock (props) {
  const sessionUser = useSelector(state => state.shared.sessionUser)
  const socket = useSelector(state => state.shared.socket)
  const dispatch = useDispatch()

  const [openChatWindows, setOpenChatWindows] = useState([])

  useEffect(() => {
    if (socket) {
      socket.off(MESSAGES_UI_SPAWN_CHAT_WINDOW, onSpawnChatWindow)
      socket.on(MESSAGES_UI_SPAWN_CHAT_WINDOW, onSpawnChatWindow)
    }

    return function cleanup () {
      if (socket) socket.off(MESSAGES_UI_SPAWN_CHAT_WINDOW, onSpawnChatWindow)
    }
  }, [socket])

  useEffect(() => {
    setOpenChatWindows((sessionUser && sessionUser.preferences && sessionUser.preferences.openChatWindows) || [])
  }, [sessionUser])

  useEffect(() => {}, [openChatWindows])

  const onSpawnChatWindow = data => {
    dispatch(setSessionUser())
  }

  return (
    <div className='chat-dock'>
      <div className='chat-box-wrapper clearfix'>
        {openChatWindows.map(convoId => {
          return <ChatWindow key={convoId} conversationId={convoId} />
        })}
      </div>
    </div>
  )
}

ChatDock.propTypes = {}
