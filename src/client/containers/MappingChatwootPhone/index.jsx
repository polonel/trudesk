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
 *  Updated:    4/12/19 12:20 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import mongoose from 'mongoose'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { makeObservable, observable } from 'mobx'
import { observer } from 'mobx-react'

import { createAccount } from 'actions/accounts'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchRoles } from 'actions/common'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'
import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'
import Chance from 'chance'
import setting from '../../../models/setting'
import { ConstraintViolationError } from 'ldapjs'

@observer
class MappingChatwootPhoneContainer extends React.Component {

  @observable username = this.props.email
  @observable fullname = this.props.username
  @observable email = this.props.email
  // @observable phone = this.props.phone.replace(' ','+')
  @observable phone = this.props.phone.replace(' ','+')
  @observable title = this.props.username
  selectedRole = ''
  @observable isAgentRole = false
  @observable chance = new Chance()
  @observable plainTextPass = this.chance.string({
    length: 10,
    pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
  })
  @observable password = this.plainTextPass
  @observable passwordConfirm = this.password

  @observable defaultRole
  @observable defaultGroup

  constructor(props) {
    super(props)
    makeObservable(this)
  }

  componentDidMount() {
    this.props.fetchGroups({ type: 'all' })
    this.props.fetchTeams()
    this.props.fetchRoles()

    helpers.UI.inputs()
    helpers.formvalidator()
  }

  componentDidUpdate() {
    helpers.UI.reRenderInputs()
  }

  onInputChanged(e, name) {
    this[name] = e.target.value
  }

  onAccountSelectChange(e) {
    this.selectedAccount = e.target.value

    const accountObject = this.props.accountsState.accounts.find(account => {
      return account.get('email') === this.selectedAccount
    })
    
    console.log(accountObject)

    if (!this.selectedAccount || this.selectedAccount.length < 1) this.accountSelectErrorMessage.classList.remove('hide')
    else this.accountSelectErrorMessage.classList.add('hide')
  }

  onGroupSelectChange() {
    const selectedGroups = this.groupSelect.getSelected()
    console.log(selectedGroups)
    console.log(this.groupSelect)
    if (!selectedGroups || selectedGroups.length < 1) this.groupSelectErrorMessage.classList.remove('hide')
    else this.groupSelectErrorMessage.classList.add('hide')
  }

  //Валидация номера телефона
  _validatePhone(phone) {
    if (!phone) return false
    return phone
      .toString()
      .toLowerCase()
      .match(
        /^\+(\d{11})$/
      )
  }


  onFormSubmit(e) {
    e.preventDefault()
    const $form = $(e.target)

    let isValid = true

    if (!$form.isValid(null, null, false)) isValid = false

    if (!this._validatePhone(this.phone)) {
      helpers.UI.showSnackbar('Invalid Phone', true)
      return
    }

    if ((!this.selectedAccount || this.selectedAccount.length < 1)) {
      this.selectedAccount = this.defaultAccount
      if ((!this.selectedAccount || this.selectedAccount.length < 1)) {
      this.AccountSelectErrorMessage.classList.remove('hide')
      if (isValid) isValid = false
      } else this.AccountSelectErrorMessage.classList.add('hide')
      
    } else this.AccountSelectErrorMessage.classList.add('hide')

    let selectedGroups = this.groupSelect ? this.groupSelect.getSelected() : undefined
    if (selectedGroups) {
      if (selectedGroups.length < 1) {
        selectedGroups = this.defaultGroup
      if (selectedGroups.length < 1) {
        this.groupSelectErrorMessage.classList.remove('hide')
        if (isValid) isValid = false
      }else this.groupSelectErrorMessage.classList.add('hide')

      } else this.groupSelectErrorMessage.classList.add('hide')
    }


    if (!isValid) return

    const payload = {
      username: this.username,
      fullname: this.fullname,
      title: this.title,
      email: this.email,
      phone: this.phone,
      groups: this.groupSelect ? this.groupSelect.getSelected() : undefined,
      teams: this.teamSelect ? this.teamSelect.getSelected() : undefined,
      role: this.selectedRole,
      password: this.password.length > 3 ? this.password : undefined,
      passwordConfirm: this.passwordConfirm.length > 3 ? this.passwordConfirm : undefined
    }

    this.props.createAccount(payload)
  }

  render() {

    const roles = this.props.roles
      .map(role => {
        return { text: role.get('name'), value: role.get('_id') }
      })
      .toArray()

    const groups = this.props.groups
      .map(group => {
        return { text: group.get('name'), value: group.get('_id'), domainName: group.get('domainName') }
      })
      .toArray()

    const teams = this.props.teams
      .map(team => {
        return { text: team.get('name'), value: team.get('_id') }
      })
      .toArray()

    let defaultRole;
    for (let role of roles) {
      if (role.text == 'User') {
        defaultRole = role.value;
      }
    }
    this.defaultRole = defaultRole;

    let defaultGroup = [];
    for (let group of groups) {
      if (group.domainName == this.email.split('@')[1]) {
       defaultGroup[0] = group.value;
      }
    }
    this.defaultGroup = defaultGroup;

    const users = this.props.accountsState.accounts.map(user => user.email);

    return (
      <BaseModal parentExtraClass={'pt-0'} extraClass={'p-0 pb-25'}>
        <div className='user-heading' style={{ minHeight: '10px', background: '#1976d2', padding: '24px' }}>
          <div className='uk-width-1-1'>
            <div className='user-heading-content'>
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
            <div className='uk-margin-medium-bottom'>
              <label className='uk-form-label'>Phone</label>
              <input
                type='text'
                className={'md-input'}
                value={this.phone}
                onChange={e => this.onInputChanged(e, 'phone')}
              />
            </div>
            <div className='uk-margin-medium-bottom'>
              <label className={'uk-form-label'}>User</label>
              <SingleSelect
                items={users}
                width={'100'}
                showTextbox={false}
                defaultValue={this.email}
                onSelectChange={e => this.onAccountSelectChange(e)}
              />
              <span
                className='hide help-block'
                style={{ display: 'inline-block', marginTop: '10px', fontWeight: 'bold', color: '#d85030' }}
                ref={r => (this.roleSelectErrorMessage = r)}
              >
                Please select a role for this user
              </span>
            </div>
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

MappingChatwootPhoneContainer.propTypes = {
  common: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired,
  teams: PropTypes.object.isRequired,
  roles: PropTypes.object.isRequired,
  createAccount: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  fetchRoles: PropTypes.func.isRequired,
  accountsState: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  roles: state.shared.roles,
  common: state.common,
  groups: state.groupsState.groups,
  teams: state.teamsState.teams,
  accountsState: state.accountsState,
})

export default connect(mapStateToProps, {
  createAccount,
  fetchGroups,
  unloadGroups,
  fetchTeams,
  unloadTeams,
  fetchRoles
})(MappingChatwootPhoneContainer)