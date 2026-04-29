import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { saveEditTeam } from 'actions/teams'

import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import Button from 'components/Button'
import MultiSelect from 'components/MultiSelect'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'

function EditTeamModal ({ team, accounts, accountsLoading, fetchAccounts, unloadAccounts, saveEditTeam }) {
  const [name, setName] = useState(team.name)
  const membersSelectRef = useRef(null)

  useEffect(() => {
    fetchAccounts({ type: 'all', limit: -1 })
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

  const onSaveTeamEdit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const payload = {
      _id: team._id,
      name,
      members: membersSelectRef.current ? membersSelectRef.current.getSelected() : []
    }

    saveEditTeam(payload)
  }

  const mappedAccounts = accounts
    .filter(account => account.getIn(['role', 'isAgent']) === true && !account.get('deleted'))
    .map(account => ({ text: account.get('fullname'), value: account.get('_id') }))
    .toArray()

  const selectedMembers = team.members

  return (
    <BaseModal options={{ bgclose: false }}>
      <SpinLoader active={accountsLoading} />
      <div className={'mb-25'}>
        <h2>Edit Team</h2>
      </div>
      <form className={'uk-form-stacked'} onSubmit={onSaveTeamEdit}>
        <div className={'uk-margin-medium-bottom'}>
          <label>Team Name</label>
          <input
            type='text'
            className={'md-input'}
            value={name}
            onChange={e => setName(e.target.value)}
            data-validation='length'
            data-validation-length={'2-25'}
            data-validation-error-msg={'Please enter a valid Team name. (Must contain 2 characters)'}
          />
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label style={{ marginBottom: 5 }}>Team Members</label>
          <MultiSelect
            items={mappedAccounts}
            initialSelected={selectedMembers}
            onChange={noop}
            ref={membersSelectRef}
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Save Team'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

EditTeamModal.propTypes = {
  team: PropTypes.object.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  saveEditTeam: PropTypes.func.isRequired,
  accounts: PropTypes.object.isRequired,
  accountsLoading: PropTypes.bool.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts,
  accountsLoading: state.accountsState.loading
})

export default connect(mapStateToProps, { fetchAccounts, unloadAccounts, saveEditTeam })(EditTeamModal)
