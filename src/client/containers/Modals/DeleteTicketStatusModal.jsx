import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchTicketStatus, deleteStatus } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'

import helpers from 'lib/helpers'

function DeleteTicketStatusModal ({ status, settings, deleteStatus }) {
  const [selectedStatus, setSelectedStatus] = useState('')

  const ticketStatuses = settings && settings.get('status') ? settings.get('status').toArray() : []
  const mappedStatuses = ticketStatuses
    .filter(obj => status.get('name') !== obj.get('name'))
    .map(item => ({ text: item.get('name'), value: item.get('_id') }))

  const onFormSubmit = e => {
    e.preventDefault()
    if (!selectedStatus) {
      helpers.UI.showSnackbar('Unable to get new ticket status. Aborting...', true)
      return true
    }
    deleteStatus({ id: status.get('_id'), newStatusId: selectedStatus })
  }

  return (
    <BaseModal options={{ bgclose: false }}>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
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
              onSelectChange={e => setSelectedStatus(e.target.value)}
              value={selectedStatus}
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
