import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { createAccount } from 'actions/accounts'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchRoles } from 'actions/common'

import BaseModal from './BaseModal'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'
import MultiSelect from 'components/MultiSelect'

import $ from 'jquery'
import helpers from 'lib/helpers'

function CreateAccountModal ({ groups, teams, roles, createAccount, fetchGroups, unloadGroups, fetchTeams, unloadTeams, fetchRoles }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [isAgentRole, setIsAgentRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const roleSelectErrorRef = useRef(null)
  const groupSelectErrorRef = useRef(null)
  const groupSelectRef = useRef(null)
  const teamSelectRef = useRef(null)

  useEffect(() => {
    fetchGroups({ type: 'all' })
    fetchTeams()
    fetchRoles()
    helpers.UI.inputs()
    helpers.formvalidator()
    return () => {
      unloadGroups()
      unloadTeams()
    }
  }, [])

  useEffect(() => {
    helpers.UI.reRenderInputs()
  })

  const onRoleSelectChange = e => {
    const roleId = e.target.value
    setSelectedRole(roleId)
    const roleObject = roles.find(role => role.get('_id') === roleId)
    setIsAgentRole(roleObject.get('isAdmin') || roleObject.get('isAgent'))

    if (!roleId || roleId.length < 1) roleSelectErrorRef.current?.classList.remove('hide')
    else roleSelectErrorRef.current?.classList.add('hide')
  }

  const onGroupSelectChange = () => {
    const selectedGroups = groupSelectRef.current?.getSelected()
    if (!selectedGroups || selectedGroups.length < 1) groupSelectErrorRef.current?.classList.remove('hide')
    else groupSelectErrorRef.current?.classList.add('hide')
  }

  const onFormSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)

    let isValid = true

    if (!$form.isValid(null, null, false)) isValid = false

    if (!selectedRole || selectedRole.length < 1) {
      roleSelectErrorRef.current?.classList.remove('hide')
      if (isValid) isValid = false
    } else roleSelectErrorRef.current?.classList.add('hide')

    const selectedGroups = groupSelectRef.current ? groupSelectRef.current.getSelected() : undefined
    if (selectedGroups) {
      if (selectedGroups.length < 1) {
        groupSelectErrorRef.current?.classList.remove('hide')
        if (isValid) isValid = false
      } else groupSelectErrorRef.current?.classList.add('hide')
    }

    if (!isValid) return

    const payload = {
      username,
      fullname,
      title,
      email,
      groups: groupSelectRef.current ? groupSelectRef.current.getSelected() : undefined,
      teams: teamSelectRef.current ? teamSelectRef.current.getSelected() : undefined,
      role: selectedRole,
      password: password.length > 3 ? password : undefined,
      passwordConfirm: passwordConfirm.length > 3 ? passwordConfirm : undefined
    }

    createAccount(payload)
  }

  const mappedRoles = roles
    .map(role => ({ text: role.get('name'), value: role.get('_id') }))
    .toArray()

  const mappedGroups = groups
    .map(group => ({ text: group.get('name'), value: group.get('_id') }))
    .toArray()

  const mappedTeams = teams
    .map(team => ({ text: team.get('name'), value: team.get('_id') }))
    .toArray()

  return (
    <BaseModal parentExtraClass={'pt-0'} extraClass={'p-0 pb-25'}>
      <div className='user-heading' style={{ minHeight: '130px', background: '#1976d2', padding: '24px' }}>
        <div className='uk-width-1-1'>
          <div style={{ width: '82px', height: '82px', float: 'left', marginRight: '24px', position: 'relative' }}>
            <div className='mediumProfilePic' style={{ position: 'relative' }}>
              <img src={`/uploads/users/defaultProfile.jpg`} alt='Profile Picture' />
            </div>
          </div>
          <div className='user-heading-content'>
            <h2>
              <span className={'uk-text-truncate'}>Create Account</span>
              <span className='sub-heading'>Please provide account details below</span>
            </h2>
          </div>
        </div>
      </div>
      <div style={{ margin: '24px 24px 0 24px' }}>
        <form className='uk-form-stacked' onSubmit={onFormSubmit}>
          <div className='uk-margin-medium-bottom'>
            <label className='uk-form-label'>Username</label>
            <input
              type='text'
              className={'md-input'}
              value={username}
              onChange={e => setUsername(e.target.value)}
              data-validation={'length'}
              data-validation-length={'min4'}
              data-validation-error-msg={'Username must contain at least 4 characters.'}
            />
          </div>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <div className='uk-float-left' style={{ width: '50%', paddingRight: '20px' }}>
              <label className={'uk-form-label'}>Name</label>
              <input
                type='text'
                className={'md-input'}
                value={fullname}
                onChange={e => setFullname(e.target.value)}
                data-validation={'length'}
                data-validation-length={'min1'}
                data-validation-error-msg={'Name must contain at least 1 character.'}
              />
            </div>
            <div className='uk-float-left uk-width-1-2'>
              <label className={'uk-form-label'}>Title</label>
              <input
                type='text'
                className={'md-input'}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
          </div>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <div className='uk-float-left' style={{ width: '50%', paddingRight: '20px' }}>
              <label className={'uk-form-label'}>Password</label>
              <input
                type='password'
                className={'md-input'}
                name={'password_confirmation'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className='uk-float-left uk-width-1-2'>
              <label className={'uk-form-label'}>Confirm Password</label>
              <input
                type='password'
                className={'md-input'}
                name={'password'}
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                data-validation='confirmation'
                data-validation-error-msg={'Password does not match'}
              />
            </div>
          </div>
          <div className='uk-margin-medium-bottom'>
            <label className='uk-form-label'>Email</label>
            <input
              type='email'
              className={'md-input'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              data-validation='email'
            />
          </div>
          <div className='uk-margin-medium-bottom'>
            <label className={'uk-form-label'}>Role</label>
            <SingleSelect
              items={mappedRoles}
              width={'100'}
              showTextbox={false}
              onSelectChange={onRoleSelectChange}
            />
            <span
              className='hide help-block'
              style={{ display: 'inline-block', marginTop: '10px', fontWeight: 'bold', color: '#d85030' }}
              ref={roleSelectErrorRef}
            >
              Please select a role for this user
            </span>
          </div>
          {!isAgentRole && (
            <div>
              <div className='uk-margin-medium-bottom'>
                <label className='uk-form-label'>Groups</label>
                <MultiSelect
                  items={mappedGroups}
                  onChange={onGroupSelectChange}
                  ref={groupSelectRef}
                />
                <span
                  className={'hide help-block'}
                  style={{ display: 'inline-block', marginTop: '3px', fontWeight: 'bold', color: '#d85030' }}
                  ref={groupSelectErrorRef}
                >
                  Please select a group for this user.
                </span>
              </div>
            </div>
          )}
          {isAgentRole && (
            <div>
              <div className='uk-margin-medium-bottom'>
                <label className='uk-form-label'>Teams</label>
                <MultiSelect items={mappedTeams} onChange={noop} ref={teamSelectRef} />
              </div>
            </div>
          )}
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={'Create Account'} flat={true} waves={true} style={'success'} type={'submit'} />
          </div>
        </form>
      </div>
    </BaseModal>
  )
}

CreateAccountModal.propTypes = {
  groups: PropTypes.object.isRequired,
  teams: PropTypes.object.isRequired,
  roles: PropTypes.object.isRequired,
  createAccount: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  fetchRoles: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  roles: state.shared.roles,
  groups: state.groupsState.groups,
  teams: state.teamsState.teams
})

export default connect(mapStateToProps, {
  createAccount,
  fetchGroups,
  unloadGroups,
  fetchTeams,
  unloadTeams,
  fetchRoles
})(CreateAccountModal)
