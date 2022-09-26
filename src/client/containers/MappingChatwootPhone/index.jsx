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

import { createAccount, fetchAccounts } from 'actions/accounts'
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
import axios from 'axios'

@observer
class MappingChatwootPhoneContainer extends React.Component {

  @observable username = this.props.email
  @observable fullname = this.props.username
  @observable email = this.props.email
  // @observable phone = this.props.phone.replace(' ','+')
  @observable phone = this.props.phone.replace(' ', '+')
  @observable title = this.props.username
  selectedUser = ''
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
    this.props.fetchAccounts()
    helpers.UI.inputs()
    helpers.formvalidator()
  }

  componentDidUpdate() {
    helpers.UI.reRenderInputs()
  }

  onInputChanged(e, name) {
    this[name] = e.target.value
  }

  onUserSelectChange(e) {
    this.selectedUser = e.target.value

    const userObject = this.props.accountsState.accounts.find(user => {
      return user.get('_id') === this.selectedUser
    })

    // this.isAgentRole = roleObject.get('isAdmin') || roleObject.get('isAgent')

    // if (!this.selectedRole || this.selectedRole.length < 1) this.roleSelectErrorMessage.classList.remove('hide')
    // else this.roleSelectErrorMessage.classList.add('hide')
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

    if (!this._validatePhone(this.phone)) {
      helpers.UI.showSnackbar('Invalid Phone', true)
      return
    }
    const contact = {
      "name": "Lin",
      "email": "fraxiumhamfre@gmail.com",
      "phone_number": "+79163957041",
      "avatar": null,
      "avatar_url": null,
      "identifier": null,
      "custom_attributes": {}
    }

    let config = {
      method: 'put',
      url: 'https://cw.shatura.pro/api/v1/accounts/1/contacts/265',
      headers: {
        'api_access_token': 'DmqbNynqFJFK7ZDdpHv4AQzf',
        'Content-Type': 'application/json',
      },
      data: contact
    };

    axios(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });



    // axios.put('https://cw.shatura.pro/api/v1/accounts/1/contacts/265', contact).then(res => {
    //   console.log(res.data)
    // }).catch(err => { console.log(err) })
    // this.props.createAccount(payload)
  }

  render() {

    const roles = this.props.roles
      .map(role => {
        return { text: role.get('name'), value: role.get('_id') }
      })
      .toArray()

    let defaultRole;
    for (let role of roles) {
      if (role.text == 'User') {
        defaultRole = role.value;
      }
    }

    const users = this.props.accountsState.accounts
      .map(user => {
        return { text: user.get('email'), value: user.get('_id') }
      })
      .toArray()

    console.log(users);

    let defaultUser;
    for (let user of users) {
      if (user.text == this.email) {
        defaultUser = user.value;
      }
    }


    // const users = this.props.accountsState.accounts.map(user => user.email);

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
                defaultValue={defaultUser}
                onSelectChange={e => this.onUserSelectChange(e)}
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
              <Button text={'Link to Chatwoot'} flat={true} waves={true} style={'success'} type={'submit'} />
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
  fetchRoles,
  fetchAccounts
})(MappingChatwootPhoneContainer)