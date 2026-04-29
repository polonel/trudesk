import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { createGroup } from 'actions/groups'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'

import helpers from 'lib/helpers'
import $ from 'jquery'

function CreateGroupModal ({ accounts, fetchAccounts, unloadAccounts, createGroup }) {
  const [name, setName] = useState('')
  const membersSelectRef = useRef(null)

  useEffect(() => {
    fetchAccounts({ type: 'customers' })
    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    helpers.formvalidator()
    return () => {
      unloadAccounts()
    }
  }, [])

  useEffect(() => {
    helpers.UI.reRenderInputs()
  })

  const onFormSubmit = e => {
    e.preventDefault()

    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const postData = {
      name,
      members: membersSelectRef.current ? membersSelectRef.current.getSelected() : []
    }

    createGroup(postData)
  }

  const mappedAccounts = accounts
    .map(account => ({ text: account.get('fullname'), value: account.get('_id') }))
    .toArray()

  return (
    <BaseModal>
      <div className={'mb-25'}>
        <h2>Create Group</h2>
      </div>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
        <div className={'uk-margin-medium-bottom'}>
          <label>Group Name</label>
          <input
            type='text'
            className={'md-input'}
            value={name}
            onChange={e => setName(e.target.value)}
            data-validation='length'
            data-validation-length={'min2'}
            data-validation-error-msg={'Please enter a valid Group name. (Must contain 2 characters)'}
          />
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label style={{ marginBottom: 5 }}>Group Members</label>
          <MultiSelect items={mappedAccounts} onChange={noop} ref={membersSelectRef} />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Create Group'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateGroupModal.propTypes = {
  accounts: PropTypes.object.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  createGroup: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts
})

export default connect(mapStateToProps, { createGroup, fetchAccounts, unloadAccounts })(CreateGroupModal)
