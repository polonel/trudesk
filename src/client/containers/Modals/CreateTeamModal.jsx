import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { createTeam } from 'actions/teams'

import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import $ from 'jquery'
import Button from 'components/Button'
import MultiSelect from 'components/MultiSelect'

function CreateTeamModal ({ accounts, fetchAccounts, unloadAccounts, createTeam }) {
  const [name, setName] = useState('')
  const membersSelectRef = useRef(null)

  useEffect(() => {
    fetchAccounts({ limit: -1 })
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
      name,
      members: membersSelectRef.current ? membersSelectRef.current.getSelected() : []
    }

    createTeam(payload)
  }

  const mappedAccounts = accounts
    .filter(account => account.getIn(['role', 'isAgent']) === true && !account.get('deleted'))
    .map(account => ({ text: account.get('fullname'), value: account.get('_id') }))
    .toArray()

  return (
    <BaseModal options={{ bgclose: false }}>
      <div className={'mb-25'}>
        <h2>Create Team</h2>
      </div>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
        <div className={'uk-margin-medium-bottom'}>
          <label>Team Name</label>
          <input
            type='text'
            className={'md-input'}
            value={name}
            onChange={e => setName(e.target.value)}
            data-validation='length'
            data-validation-length={'min2'}
            data-validation-error-msg={'Please enter a valid Team name. (Must contain 2 characters)'}
          />
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label style={{ marginBottom: 5 }}>Team Members</label>
          <MultiSelect items={mappedAccounts} onChange={noop} ref={membersSelectRef} />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Create Team'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateTeamModal.propTypes = {
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  accounts: PropTypes.object.isRequired,
  createTeam: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts
})

export default connect(mapStateToProps, { fetchAccounts, unloadAccounts, createTeam })(CreateTeamModal)
