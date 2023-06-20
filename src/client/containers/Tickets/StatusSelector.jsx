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
import { observer } from 'mobx-react'
import { observable, makeObservable } from 'mobx'
import { connect } from 'react-redux'

import { TICKETS_STATUS_SET, TICKETS_UI_STATUS_UPDATE } from 'serverSocket/socketEventConsts'
import { fetchTicketStatus } from 'actions/tickets'

@observer
class StatusSelector extends React.Component {
  @observable status = null

  constructor (props) {
    super(props)
    makeObservable(this)

    this.status = this.props.status

    this.onDocumentClick = this.onDocumentClick.bind(this)
    this.onUpdateTicketStatus = this.onUpdateTicketStatus.bind(this)
  }

  componentDidMount () {
    document.addEventListener('click', this.onDocumentClick)

    this.props.socket.on(TICKETS_UI_STATUS_UPDATE, this.onUpdateTicketStatus)
    this.props.fetchTicketStatus()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.status !== this.props.status) this.status = this.props.status
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.onDocumentClick)
    this.props.socket.off(TICKETS_UI_STATUS_UPDATE, this.onUpdateTicketStatus)
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

    this.props.socket.emit(TICKETS_STATUS_SET, { _id: this.props.ticketId, value: status })
    this.forceClose()
  }

  render () {
    const currentStatus = this.props.ticketStatuses
      ? this.props.ticketStatuses.find(s => s.get('uid') === this.status)
      : null

    return (
      <div className='floating-ticket-status'>
        <div
          title='Change Status'
          className={clsx(`ticket-status`, this.props.hasPerm && `cursor-pointer`)}
          style={{ color: 'white', background: currentStatus != null ? currentStatus.get('htmlColor') : '#000000' }}
          onClick={e => this.toggleDropMenu(e)}
          ref={r => (this.selectorButton = r)}
        >
          <span>{currentStatus != null ? currentStatus.get('name') : 'Unknown'}</span>
        </div>

        {this.props.hasPerm && (
          <span className='drop-icon material-icons' style={{ left: 'auto', right: 22, bottom: -18 }}>
            keyboard_arrow_down
          </span>
        )}

        <div
          id={'statusSelect'}
          ref={r => (this.dropMenu = r)}
          className='hide'
          style={{ height: 25 * this.props.ticketStatuses.size + 25 }}
        >
          <ul>
            {this.props.ticketStatuses.map(
              s =>
                s && (
                  <li
                    key={s.get('_id')}
                    className='ticket-status'
                    onClick={() => this.changeStatus(s.get('uid'))}
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
}

StatusSelector.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
  onStatusChange: PropTypes.func,
  hasPerm: PropTypes.bool.isRequired,
  socket: PropTypes.object.isRequired,
  fetchTicketStatus: PropTypes.func.isRequired,
  ticketStatuses: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  ticketStatuses: state.ticketsState.ticketStatuses
})

StatusSelector.defaultProps = {
  hasPerm: false
}

export default connect(mapStateToProps, {
  fetchTicketStatus
})(StatusSelector)
