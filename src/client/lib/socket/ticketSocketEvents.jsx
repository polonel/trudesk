import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { TICKETS_CREATED } from 'serverSocket/socketEventConsts'
import helpers from 'lib/helpers'
import { TICKETS_COMMENT_NOTE_SET } from '../../../socketio/socketEventConsts'
import {TICKETS_LIST_UPDATE} from '../../../socketio/socketEventConsts'

const TicketSocketEvents = () => {
  const socket = useSelector(state => state.shared.socket)
  const viewdata = useSelector(state => state.common.viewdata)

  useEffect(() => {
    if (socket) {
      ticketCreated()
      ticketCommentAdded()
    }

    return function cleanup () {
      if (socket) socket.removeAllListeners(TICKETS_CREATED)
    }
  }, [socket, viewdata])

  const ticketCreated = () => {
    socket.removeAllListeners(TICKETS_CREATED)
    socket.emit(TICKETS_LIST_UPDATE)
    socket.on(TICKETS_CREATED, ticket => {
      if (viewdata) {
        if (viewdata.get('ticketSettings') && viewdata.get('ticketSettings').get('playNewTicketSound'))
          helpers.UI.playSound('TICKET_CREATED')
      } else {
        helpers.UI.playSound('TICKET_CREATED')
      }
    })
  }

  const ticketCommentAdded = () => {
    socket.removeAllListeners(TICKETS_COMMENT_NOTE_SET)
    socket.on(TICKETS_COMMENT_NOTE_SET, ticket => {
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
