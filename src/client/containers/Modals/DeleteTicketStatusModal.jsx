/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    6/21/23 11:59 AM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchTicketStatus, deleteStatus } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'

import helpers from 'lib/helpers'

class DeleteTicketStatusModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedStatus: ''
    }
  }

  componentDidMount () {}

  getTicketStatuses () {
    return this.props.settings && this.props.settings.get('status') ? this.props.settings.get('status').toArray() : []
  }

  onSelectChanged (e) {
    this.setState({
      selectedStatus: e.target.value
    })
  }

  onFormSubmit (e) {
    e.preventDefault()
    if (!this.state.selectedStatus) {
      helpers.UI.showSnackbar('Unable to get new ticket status. Aborting...', true)
      return true
    }

    this.props.deleteStatus({ id: this.props.status.get('_id'), newStatusId: this.state.selectedStatus })
  }

  render () {
    const { status } = this.props
    const mappedStatuses = this.getTicketStatuses()
      .filter(obj => {
        return status.get('name') !== obj.get('name')
      })
      .map(item => {
        return { text: item.get('name'), value: item.get('_id') }
      })
    return (
      <BaseModal {...this.props} options={{ bgclose: false }}>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <h2>Remove Ticket Status</h2>
            <span>
              Please select the ticket status you wish to reassign tickets to in order to delete this ticket status.
            </span>
          </div>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <div className='uk-float-left' style={{ width: '100%' }}>
              <label className={'uk-form-label nopadding nomargin'}>Status</label>
              <SingleSelect
                showTextbox={false}
                items={mappedStatuses}
                onSelectChange={e => this.onSelectChanged(e)}
                value={this.state.selectedStatus}
              />
            </div>
          </div>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <span className='uk-text-danger'>
              WARNING: This will change all tickets with status <strong>{status.get('name')}</strong> to the selected
              ticket status.
              <br />
              <strong>This is permanent!</strong>
            </span>
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Cancel'} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={'Delete'} style={'danger'} flat={true} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

DeleteTicketStatusModal.propTypes = {
  status: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  deleteStatus: PropTypes.func.isRequired,
  fetchTicketStatus: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings,
  ticketStatuses: state.ticketsState.ticketStatuses
})

export default connect(mapStateToProps, { fetchTicketStatus, deleteStatus })(DeleteTicketStatusModal)
