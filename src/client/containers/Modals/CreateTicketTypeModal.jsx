import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createTicketType } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'

import $ from 'jquery'
import helpers from 'lib/helpers'

function CreateTicketTypeModal ({ createTicketType }) {
  const [typeName, setTypeName] = useState('')

  useEffect(() => {
    helpers.UI.inputs()
    helpers.formvalidator()
  }, [])

  const onCreateTicketTypeSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return
    createTicketType({ name: typeName })
  }

  return (
    <BaseModal>
      <form className={'uk-form-stacked'} onSubmit={onCreateTicketTypeSubmit}>
        <div>
          <h2 className='nomargin mb-5'>Create Ticket Type</h2>
          <p className='uk-text-small uk-text-muted'>Create a ticket type</p>
          <label htmlFor='typeName'>Type name</label>
          <input
            value={typeName}
            onChange={e => setTypeName(e.target.value)}
            type='text'
            className={'md-input'}
            name={'typeName'}
            data-validation='length'
            data-validation-length='min3'
            data-validation-error-msg='Please enter a valid type name. Type name must contain at least 3 characters'
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Create'} style={'success'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateTicketTypeModal.propTypes = {
  onTypeCreated: PropTypes.func,
  createTicketType: PropTypes.func.isRequired
}

export default connect(null, { createTicketType })(CreateTicketTypeModal)
