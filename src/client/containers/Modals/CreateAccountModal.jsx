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
 *  Updated:    2/26/19 11:49 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

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

@observer
class CreateAccountModal extends React.Component {
  @observable username = ''
  @observable password = ''
  @observable passwordConfirm = ''
  @observable fullname = ''
  @observable email = ''
  @observable title = ''
  selectedRole = ''
  @observable isAgentRole = false

  componentDidMount () {
    this.props.fetchGroups({ type: 'all' })
    this.props.fetchTeams()
    this.props.fetchRoles()

    helpers.UI.inputs()
    helpers.formvalidator()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  onInputChanged (e, name) {
    this[name] = e.target.value
  }

  onRoleSelectChange (e) {
    this.selectedRole = e.target.value

    const roleObject = this.props.roles.find(role => {
      return role.get('_id') === this.selectedRole
    })

    this.isAgentRole = roleObject.get('isAdmin') || roleObject.get('isAgent')

    if (!this.selectedRole || this.selectedRole.length < 1) this.roleSelectErrorMessage.classList.remove('hide')
    else this.roleSelectErrorMessage.classList.add('hide')
  }

  onGroupSelectChange () {
    const selectedGroups = this.groupSelect.getSelected()
    if (!selectedGroups || selectedGroups.length < 1) this.groupSelectErrorMessage.classList.remove('hide')
    else this.groupSelectErrorMessage.classList.add('hide')
  }

  onFormSubmit (e) {
    e.preventDefault()
    const $form = $(e.target)

    let isValid = true

    if (!$form.isValid(null, null, false)) isValid = false

    if (!this.selectedRole || this.selectedRole.length < 1) {
      this.roleSelectErrorMessage.classList.remove('hide')
      if (isValid) isValid = false
    } else this.roleSelectErrorMessage.classList.add('hide')

    const selectedGroups = this.groupSelect ? this.groupSelect.getSelected() : undefined
    if (selectedGroups) {
      if (selectedGroups.length < 1) {
        this.groupSelectErrorMessage.classList.remove('hide')
        if (isValid) isValid = false
      } else this.groupSelectErrorMessage.classList.add('hide')
    }

    if (!isValid) return

    const payload = {
      username: this.username,
      fullname: this.fullname,
      title: this.title,
      email: this.email,
      groups: this.groupSelect ? this.groupSelect.getSelected() : undefined,
      teams: this.teamSelect ? this.teamSelect.getSelected() : undefined,
      role: this.selectedRole,
      password: this.password.length > 1 ? this.password : undefined,
      passwordConfirm: this.passwordConfirm.length > 1 ? this.passwordConfirm : undefined
    }

    this.props.createAccount(payload)
  }

  render () {
    const roles = this.props.roles
      .map(role => {
        return { text: role.get('name'), value: role.get('_id') }
      })
      .toArray()

    const groups = this.props.groups
      .map(group => {
        return { text: group.get('name'), value: group.get('_id') }
      })
      .toArray()

    const teams = this.props.teams
      .map(team => {
        return { text: team.get('name'), value: team.get('_id') }
      })
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
          <form className='uk-form-stacked' onSubmit={e => this.onFormSubmit(e)}>
            <div className='uk-margin-medium-bottom'>
              <label className='uk-form-label'>Username</label>
              <input
                type='text'
                className={'md-input'}
                value={this.username}
                onChange={e => this.onInputChanged(e, 'username')}
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
                  value={this.fullname}
                  onChange={e => this.onInputChanged(e, 'fullname')}
                  data-validation={'length'}
                  data-validation-length={'min2'}
                  data-validation-error-msg={'Name must contain at least 2 characters.'}
                />
              </div>
              <div className='uk-float-left uk-width-1-2'>
                <label className={'uk-form-label'}>Title</label>
                <input
                  type='text'
                  className={'md-input'}
                  value={this.title}
                  onChange={e => this.onInputChanged(e, 'title')}
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
                  value={this.password}
                  onChange={e => this.onInputChanged(e, 'password')}
                  data-validation={'length'}
                  data-validation-length={'min6'}
                  data-validation-error-msg={'Password must contain at least 6 characters.'}
                />
              </div>
              <div className='uk-float-left uk-width-1-2'>
                <label className={'uk-form-label'}>Confirm Password</label>
                <input
                  type='password'
                  className={'md-input'}
                  name={'password'}
                  value={this.passwordConfirm}
                  onChange={e => this.onInputChanged(e, 'passwordConfirm')}
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
                value={this.email}
                onChange={e => this.onInputChanged(e, 'email')}
                data-validation='email'
              />
            </div>
            <div className='uk-margin-medium-bottom'>
              <label className={'uk-form-label'}>Role</label>
              <SingleSelect
                items={roles}
                width={'100'}
                showTextbox={false}
                onSelectChange={e => this.onRoleSelectChange(e)}
              />
              <span
                className='hide help-block'
                style={{ display: 'inline-block', marginTop: '10px', fontWeight: 'bold', color: '#d85030' }}
                ref={r => (this.roleSelectErrorMessage = r)}
              >
                Please select a role for this user
              </span>
            </div>
            {!this.isAgentRole && (
              <div>
                <div className='uk-margin-medium-bottom'>
                  <label className='uk-form-label'>Groups</label>
                  <MultiSelect
                    items={groups}
                    onChange={e => this.onGroupSelectChange(e)}
                    ref={r => (this.groupSelect = r)}
                  />
                  <span
                    className={'hide help-block'}
                    style={{ display: 'inline-block', marginTop: '3px', fontWeight: 'bold', color: '#d85030' }}
                    ref={r => (this.groupSelectErrorMessage = r)}
                  >
                    Please select a group for this user.
                  </span>
                </div>
              </div>
            )}
            {this.isAgentRole && (
              <div>
                <div className='uk-margin-medium-bottom'>
                  <label className='uk-form-label'>Teams</label>
                  <MultiSelect items={teams} onChange={() => {}} ref={r => (this.teamSelect = r)} />
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
}

CreateAccountModal.propTypes = {
  common: PropTypes.object.isRequired,
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
  common: state.common,
  groups: state.groupsState.groups,
  teams: state.teamsState.teams
})

export default connect(
  mapStateToProps,
  { createAccount, fetchGroups, unloadGroups, fetchTeams, unloadTeams, fetchRoles }
)(CreateAccountModal)
