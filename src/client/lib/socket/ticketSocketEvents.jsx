import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { TICKETS_CREATED } from 'serverSocket/socketEventConsts'
import helpers from 'lib/helpers'

const TicketSocketEvents = () => {
  const socket = useSelector(state => state.shared.socket)

  useEffect(() => {
    if (socket) {
      ticketCreated()
    }
  }, [socket])

  const ticketCreated = () => {
    socket.removeAllListeners(TICKETS_CREATED)
    socket.on(TICKETS_CREATED, ticket => {
      helpers.UI.playSound('TICKET_CREATED')
    })
  }

  return <div />
}

export default TicketSocketEvents
