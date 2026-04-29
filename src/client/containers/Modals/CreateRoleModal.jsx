import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { createRole } from 'actions/settings'

import Button from 'components/Button'
import BaseModal from './BaseModal'

function CreateRoleModal ({ createRole }) {
  const [name, setName] = useState('')

  const onCreateRoleClicked = e => {
    e.preventDefault()
    createRole({ name })
  }

  return (
    <BaseModal>
      <div className={'uk-form-stacked'}>
        <div>
          <h2 className={'nomargin mb-5'}>Create Role</h2>
          <p className='uk-text-muted'>Once created, the role will become editable in the permission editor</p>

          <label>Role Name</label>
          <input
            type='text'
            className={'md-input'}
            name={'name'}
            data-validation='length'
            data-validation-length='min3'
            data-validation-error-msg='Please enter a valid role name. Role name must contain at least 3 characters.'
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} extraClass={'uk-modal-close'} flat={true} waves={true} />
          <Button
            text={'Create'}
            type={'button'}
            flat={true}
            waves={true}
            style={'success'}
            onClick={onCreateRoleClicked}
          />
        </div>
      </div>
    </BaseModal>
  )
}

CreateRoleModal.propTypes = {
  createRole: PropTypes.func.isRequired
}

export default connect(null, { createRole })(CreateRoleModal)
