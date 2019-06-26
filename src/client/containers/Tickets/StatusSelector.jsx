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

import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import socket from 'lib/socket'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

const statusToName = status => {
  switch (status) {
    case 0:
      return 'New'
    case 1:
      return 'Open'
    case 2:
      return 'Pending'
    case 3:
      return 'Closed'
  }
}

@observer
class StatusSelector extends React.Component {
  @observable status = null
  constructor (props) {
    super(props)

    this.status = this.props.status

    this.onDocumentClick = this.onDocumentClick.bind(this)
    this.onUpdateTicketStatus = this.onUpdateTicketStatus.bind(this)
  }

  componentDidMount () {
    document.addEventListener('click', this.onDocumentClick)

    socket.socket.on('updateTicketStatus', this.onUpdateTicketStatus)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.status !== this.props.status) this.status = this.props.status
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.onDocumentClick)
    socket.socket.off('updateTicketStatus', this.onUpdateTicketStatus)
  }

  onDocumentClick (e) {
    if (!this.selectorButton.contains(e.target) && this.dropMenu.classList.contains('shown')) this.forceClose()
  }

  onUpdateTicketStatus (data) {
    if (this.props.ticketId === data.tid) {
      this.status = data.status
      if (this.props.onStatusChange) this.props.onStatusChange(this.status)
    }
  }

  toggleDropMenu (e) {
    e.stopPropagation()
    if (!this.props.hasPerm) return
    const hasHide = this.dropMenu.classList.contains('hide')
    const hasShown = this.dropMenu.classList.contains('shown')
    hasHide ? this.dropMenu.classList.remove('hide') : this.dropMenu.classList.add('hide')
    hasShown ? this.dropMenu.classList.remove('shown') : this.dropMenu.classList.add('shown')
  }

  forceClose () {
    this.dropMenu.classList.remove('shown')
    this.dropMenu.classList.add('hide')
  }

  changeStatus (status) {
    if (!this.props.hasPerm) return

    socket.ui.sendUpdateTicketStatus(this.props.ticketId, status)
    this.forceClose()
  }

  render () {
    return (
      <div className='floating-ticket-status'>
        <div
          title='Change Status'
          className={clsx(
            `ticket-status`,
            `ticket-${statusToName(this.status).toLowerCase()}`,
            this.props.hasPerm && `cursor-pointer`
          )}
          onClick={e => this.toggleDropMenu(e)}
          ref={r => (this.selectorButton = r)}
        >
          <span>{statusToName(this.status)}</span>
        </div>

        {this.props.hasPerm && (
          <span className='drop-icon material-icons' style={{ left: 'auto', right: 22, bottom: -18 }}>
            keyboard_arrow_down
          </span>
        )}

        <div id={'statusSelect'} ref={r => (this.dropMenu = r)} className='hide'>
          <ul>
            <li className='ticket-status ticket-new' onClick={() => this.changeStatus(0)}>
              <span>New</span>
            </li>
            <li className='ticket-status ticket-open' onClick={() => this.changeStatus(1)}>
              <span>Open</span>
            </li>
            <li className='ticket-status ticket-pending' onClick={() => this.changeStatus(2)}>
              <span>Pending</span>
            </li>
            <li className='ticket-status ticket-closed' onClick={() => this.changeStatus(3)}>
              <span>Closed</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

StatusSelector.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
  onStatusChange: PropTypes.func,
  hasPerm: PropTypes.bool.isRequired
}

StatusSelector.defaultProps = {
  hasPerm: false
}

export default StatusSelector
