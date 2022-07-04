import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { TICKETS_CREATED } from 'serverSocket/socketEventConsts'
import helpers from 'lib/helpers'

const TicketSocketEvents = () => {
  const socket = useSelector(state => state.shared.socket)
  const viewdata = useSelector(state => state.common.viewdata)

  useEffect(() => {
    if (socket) {
      ticketCreated()
    }
  }, [socket, viewdata])

  const ticketCreated = () => {
    socket.removeAllListeners(TICKETS_CREATED)
    socket.on(TICKETS_CREATED, ticket => {
      if (viewdata) {
        if (viewdata.get('ticketSettings') && viewdata.get('ticketSettings').get('playNewTicketSound'))
          helpers.UI.playSound('TICKET_CREATED')
      } else {
        helpers.UI.playSound('TICKET_CREATED')
      }
    })
  }

  return <div />
}

export default TicketSocketEvents
