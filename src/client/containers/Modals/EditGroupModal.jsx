import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { updateGroup } from 'actions/groups'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'

import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'

function EditGroupModal ({ group, accounts, accountsLoading, fetchAccounts, unloadAccounts, updateGroup }) {
  const [name, setName] = useState(group.name)
  const membersSelectRef = useRef(null)
  const sendMailToSelectRef = useRef(null)

  useEffect(() => {
    fetchAccounts({ type: 'requesters', limit: -1 })
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

    const payload = {
      _id: group._id,
      name,
      members: membersSelectRef.current ? membersSelectRef.current.getSelected() : [],
      sendMailTo: sendMailToSelectRef.current ? sendMailToSelectRef.current.getSelected() : []
    }

    updateGroup(payload)
  }

  const mappedAccounts = accounts
    .map(account => ({ text: account.get('fullname'), value: account.get('_id') }))
    .toArray()

  const selectedMembers = group.members.map(member => member._id)
  const selectedSendMailTo = group.sendMailTo.map(member => member._id)

  return (
    <BaseModal>
      <SpinLoader active={accountsLoading} />
      <div className={'mb-25'}>
        <h2>Edit Group</h2>
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
          <MultiSelect
            items={mappedAccounts}
            initialSelected={selectedMembers}
            onChange={noop}
            ref={membersSelectRef}
          />
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label style={{ marginBottom: 5 }}>Send Notifications To</label>
          <MultiSelect
            items={mappedAccounts}
            initialSelected={selectedSendMailTo}
            onChange={noop}
            ref={sendMailToSelectRef}
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Save Group'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

EditGroupModal.propTypes = {
  group: PropTypes.object.isRequired,
  accounts: PropTypes.object.isRequired,
  updateGroup: PropTypes.func.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  accountsLoading: PropTypes.bool.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts,
  accountsLoading: state.accountsState.loading
})

export default connect(mapStateToProps, { updateGroup, fetchAccounts, unloadAccounts })(EditGroupModal)
