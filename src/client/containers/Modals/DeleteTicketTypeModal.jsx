import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { deleteTicketType } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'

import helpers from 'lib/helpers'

function DeleteTicketTypeModal ({ type, settings, deleteTicketType }) {
  const [selectedType, setSelectedType] = useState('')

  const ticketTypes = settings && settings.get('ticketTypes') ? settings.get('ticketTypes').toArray() : []
  const mappedTypes = ticketTypes
    .filter(obj => type.get('name') !== obj.get('name'))
    .map(item => ({ text: item.get('name'), value: item.get('_id') }))

  const onFormSubmit = e => {
    e.preventDefault()
    if (!selectedType) {
      helpers.UI.showSnackbar('Unable to get new ticket type. Aborting...', true)
      return
    }
    deleteTicketType(type.get('_id'), selectedType)
  }

  return (
    <BaseModal options={{ bgclose: false }}>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
        <div className='uk-margin-medium-bottom uk-clearfix'>
          <h2>Remove Ticket Type</h2>
          <span>Please select the ticket type you wish to reassign tickets to in order to delete this ticket type.</span>
        </div>
        <div className='uk-margin-medium-bottom uk-clearfix'>
          <div className='uk-float-left' style={{ width: '100%' }}>
            <label className={'uk-form-label nopadding nomargin'}>Type</label>
            <SingleSelect
              showTextbox={false}
              items={mappedTypes}
              onSelectChange={e => setSelectedType(e.target.value)}
              value={selectedType}
            />
          </div>
        </div>
        <div className='uk-margin-medium-bottom uk-clearfix'>
          <span className='uk-text-danger'>
            WARNING: This will change all tickets with type <strong>{type.get('name')}</strong> to the selected ticket
            type.
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

DeleteTicketTypeModal.propTypes = {
  type: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  deleteTicketType: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { deleteTicketType })(DeleteTicketTypeModal)
