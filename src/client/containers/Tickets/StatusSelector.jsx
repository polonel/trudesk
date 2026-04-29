/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/24/19 6:33 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { connect } from 'react-redux'

import { TICKETS_STATUS_SET, TICKETS_UI_STATUS_UPDATE } from 'serverSocket/socketEventConsts'
import { fetchTicketStatus } from 'actions/tickets'

function StatusSelector ({ ticketId, status: statusProp, onStatusChange, hasPerm, socket, fetchTicketStatus, ticketStatuses }) {
  const [status, setStatus] = useState(statusProp)
  const [isOpen, setIsOpen] = useState(false)
  const selectorRef = useRef(null)

  useEffect(() => {
    setStatus(statusProp)
  }, [statusProp])

  useEffect(() => {
    fetchTicketStatus()
  }, [])

  useEffect(() => {
    const onUpdateTicketStatus = data => {
      if (ticketId === data.tid) {
        setStatus(data.status)
        if (onStatusChange) onStatusChange(data.status)
      }
    }
    socket.on(TICKETS_UI_STATUS_UPDATE, onUpdateTicketStatus)
    return () => socket.off(TICKETS_UI_STATUS_UPDATE, onUpdateTicketStatus)
  }, [socket, ticketId, onStatusChange])

  useEffect(() => {
    if (!isOpen) return
    const onDocumentClick = e => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [isOpen])

  const toggleDropMenu = e => {
    e.stopPropagation()
    if (hasPerm) setIsOpen(prev => !prev)
  }

  const changeStatus = newStatus => {
    if (!hasPerm) return
    socket.emit(TICKETS_STATUS_SET, { _id: ticketId, value: newStatus })
    setIsOpen(false)
  }

  const currentStatus = ticketStatuses ? ticketStatuses.find(s => s.get('_id') === status) : null

  return (
    <div className='floating-ticket-status' ref={selectorRef}>
      <div
        title='Change Status'
        className={clsx('ticket-status', hasPerm && 'cursor-pointer')}
        style={{ color: 'white', background: currentStatus != null ? currentStatus.get('htmlColor') : '#000000' }}
        onClick={toggleDropMenu}
      >
        <span>{currentStatus != null ? currentStatus.get('name') : 'Unknown'}</span>
      </div>

      {hasPerm && (
        <span className='drop-icon material-icons' style={{ left: 'auto', right: 22, bottom: -18 }}>
          keyboard_arrow_down
        </span>
      )}

      <div
        id={'statusSelect'}
        className={isOpen ? 'shown' : 'hide'}
        style={{ height: 25 * ticketStatuses.size + 25 }}
      >
        <ul>
          {ticketStatuses.map(
            s =>
              s && (
                <li
                  key={s.get('_id')}
                  className='ticket-status'
                  onClick={() => changeStatus(s.get('_id'))}
                  style={{ color: 'white', background: s.get('htmlColor') }}
                >
                  <span>{s.get('name')}</span>
                </li>
              )
          )}
        </ul>
      </div>
    </div>
  )
}

StatusSelector.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func,
  hasPerm: PropTypes.bool.isRequired,
  socket: PropTypes.object.isRequired,
  fetchTicketStatus: PropTypes.func.isRequired,
  ticketStatuses: PropTypes.object.isRequired
}

StatusSelector.defaultProps = {
  hasPerm: false
}

const mapStateToProps = state => ({
  ticketStatuses: state.ticketsState.ticketStatuses
})

export default connect(mapStateToProps, { fetchTicketStatus })(StatusSelector)
