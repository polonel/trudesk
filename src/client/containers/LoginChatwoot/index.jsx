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

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { updateGroup } from 'actions/groups'
import { createAccountFromChatwoot } from 'actions/accounts'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'
import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'

@observer
class LoginChatwootContainer extends React.Component {
  @observable username = ''
  @observable password = ''
  @observable passwordConfirm = ''
  @observable fullname = ''
  @observable email = ''
  @observable phone = ''
  @observable title = ''
  selectedRole = ''
  @observable isAgentRole = false

  constructor (props) {
    super(props)
    makeObservable(this)
  }

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

  //Валидация номера телефона
  _validatePhone (phone) {
    if (!phone) return false
    return phone
      .toString()
      .toLowerCase()
      .match(
        /^\+(\d{11})$/
      )
  }


  onFormSubmit (e) {
    e.preventDefault()
    const $form = $(e.target)

    let isValid = true

    if (!$form.isValid(null, null, false)) isValid = false

    if (!this._validatePhone(this.phone)) {
      helpers.UI.showSnackbar('Invalid Phone', true)
      return
    }

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
    console.log('chatwoot login')

    console.log(this.props.username)
    console.log(this.props.phone)
    console.log(this.props.email)
    // window.addEventListener("message", function (event) {
    //   console.log("Запрос от chatwoot");  
    //   const eventData = JSON.parse(event.data);
    //   data = eventData.data.contact;
    //   this.username = data.name;
    //   this.phone = data.phone;
    //   this.email = data.email;
    // })



    return (
      <BaseModal>
        <div className={'mb-25'}>
          <h2> Chatwoot user </h2>
        </div>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className={'uk-margin-medium-bottom'}>
            <label>Username</label>
            <input
              type='text'
              className={'md-input'}
              value={this.props.username}
              onChange={e => this.onInputChangeUsername(e)}
              data-validation='length'
              data-validation-length={'min2'}
              data-validation-error-msg={'Please enter a valid Group name. (Must contain 2 characters)'}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label>Phone Number</label>
            <input
              type='text'
              className={'md-input'}
              value={this.props.phone}
              onChange={e => this.onInputChangePhone(e)}
              data-validation='length'
              data-validation-length={'min12'}
              data-validation-error-msg={'Please enter a valid Phone Number'}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label>Email</label>
            <input
              type='text'
              className={'md-input'}
              value={this.props.email}
              onChange={e => this.onInputChangeEmail(e)}

            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={'Submit'} flat={true} waves={true} style={'primary'} type={'submit'} />
          </div>
        </form>
      </BaseModal>

    )
  }
}

LoginChatwootContainer.propTypes = {
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

export default connect(mapStateToProps, {
  createAccount,
  fetchGroups,
  unloadGroups,
  fetchTeams,
  unloadTeams,
  fetchRoles
})(LoginChatwootContainer)