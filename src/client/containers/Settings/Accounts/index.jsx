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
 *  Updated:    5/17/22 2:20 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { updateSetting, updateMultipleSettings, fetchRoles } from 'actions/settings'
import { fetchLDAPGroups } from 'actions/ldapGroups'
import { fetchSettings } from 'actions/settings'
// import { fetchRoles } from 'actions/common'
// import settingUtil from '../../../../settings/settingsUtil'

import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'
import UploadButtonWithX from 'components/Settings/UploadButtonWithX'
import SettingSubItem from 'components/Settings/SettingSubItem'
import SingleSelect from 'components/SingleSelect'
import ColorSelector from 'components/ColorSelector'
import Zone from 'components/ZoneBox/zone'
import ZoneBox from 'components/ZoneBox'

import helpers from 'lib/helpers'
import axios from 'axios'
import Log from '../../../logger'
import EnableSwitch from 'components/Settings/EnableSwitch'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import UIKit from 'uikit'

@observer
class AccountsSettingsContainer extends React.Component {
  @observable passwordComplexityEnabled = false
  @observable allowUserRegistrationEnabled = false
  @observable ldapEnabled = false
  @observable siteURL = ''

  ldapGroupsArray = []
  // @observable LDAPSettings = false

  constructor(props) {
    super(props)

    makeObservable(this)

    this.state = {
      restarting: false,
      ldapHost: '',
      ldapBindDN: '',
      ldapPassword: '',
      ldapUsername: '',
      mapping: [],
      rolesArray: [],
      ldapEnabled: false
    }

    this.restartServer = this.restartServer.bind(this)
  }

  componentDidMount() {
    // helpers.UI.inputs()fetchLDAPGroup
    // this.props.fetchLDAPGroups({ type: 'all' })
  }

  componentDidUpdate(prevProps) {
    // helpers.UI.reRenderInputs()
    if (prevProps.settings !== this.props.settings) {
      if (this.passwordComplexityEnabled !== this.getSetting('accountsPasswordComplexity'))
        this.passwordComplexityEnabled = this.getSetting('accountsPasswordComplexity')
      if (this.allowUserRegistrationEnabled !== this.getSetting('allowUserRegistration'))
        this.allowUserRegistrationEnabled = this.getSetting('allowUserRegistration')
      if (this.ldapEnabled !== this.getSetting('ldapSettings'))
        this.ldapEnabled = this.getSetting('ldapSettings')
      this.state.ldapEnabled = !this.ldapEnabled
      if (this.state.ldapHost !== this.getSetting('ldapHost') && this.getSetting('ldapHost') !== true)
        this.state.ldapHost = this.getSetting('ldapHost')
      if (this.state.ldapBindDN !== this.getSetting('ldapBindDN') && this.getSetting('ldapBindDN') !== true)
        this.state.ldapBindDN = this.getSetting('ldapBindDN')
      if (this.state.ldapPassword !== this.getSetting('ldapPassword') && this.getSetting('ldapPassword') !== true)
        this.state.ldapPassword = this.getSetting('ldapPassword')
      // if (this.state.ldapUsername !== this.getSetting('ldapUsername') && this.getSetting('ldapUsername') !== true)
      //   this.state.ldapUsername = this.getSetting('ldapUsername')
    }
  }


  restartServer() {
    this.setState({ restarting: true })

    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    axios
      .post(
        '/api/v1/admin/restart',
        {},
        {
          headers: {
            'CSRF-TOKEN': token
          }
        }
      )
      .catch(error => {
        helpers.hideLoader()
        Log.error(error.responseText)
        Log.error('Unable to restart server. Server must run under PM2 and Account must have admin rights.')
        helpers.UI.showSnackbar('Unable to restart server. Are you an Administrator?', true)
      })
      .then(() => {
        this.setState({ restarting: false })
      })
  }

  getSetting(stateName) {
    return this.props.settings.getIn(['settings', stateName, 'value'])
      ? this.props.settings.getIn(['settings', stateName, 'value'])
      : ''
  }

  updateSetting(stateName, name, value) {
    this.props.updateSetting({ stateName, name, value })
  }

  getRoles() {
    let rolesArray = this.props.roles;
    rolesArray = this.props.roles.sortBy(role => role.get('name')).toArray();
    rolesArray = JSON.stringify(rolesArray);
    rolesArray = JSON.parse(rolesArray);
    let rolesName = [];
    for (let i = 0; i < rolesArray.length; i++) {
      if (rolesArray[i]['name'] !== 'User') {
        rolesName.push({ name: rolesArray[i]['name'], _id: rolesArray[i]['_id'], ldapGroupID: rolesArray[i]['ldapGroupID'] });
      }
    }
    return rolesName;
  }
  getLDAPGroups() {

    let ldapGArray = [];
    axios.get(`${this.siteURL}/api/v2/ldapGroups`).then(res => {
      this.ldapGroupsArray = res.data.ldapGroups;
    }).catch(err => { console.log(err) })

    for (let i = 0; i < this.ldapGroupsArray.length; i++) {
      ldapGArray.push({ text: this.ldapGroupsArray[i]['name'], value: this.ldapGroupsArray[i]['_id'] });
    }
    return ldapGArray;
  }

  onInputValueChanged(e, stateName) {
    this.setState({
      [stateName]: e.target.value
    })
  }

  updateMapping(mapping) {
    axios
      .put(`/api/v2/ldapGroups/updateMapping`, mapping)
      .then(function (res) {
        if (res.data && res.data.success) helpers.UI.showSnackbar('Mapping success')
      })
      .catch(function (err) {
        Log.error(err)
        helpers.UI.showSnackbar(err, true)
      })

  }
  addToMap(e, role, ldapGroupID) {
    const roles = this.getRoles();
    let roleExist = false;
    for (let map of this.state.mapping) {
      if (map.roleID == role._id) {
        map.ldapGroupID = ldapGroupID
        roleExist = true
      }
    }

    if (roleExist == false) {
      this.state.mapping.push({ roleID: role._id, ldapGroupID: ldapGroupID })
    }

  }

  onCheckNowClicked(e) {
      axios
        .post(`/api/v2/loginLDAP`, {
          // 'login-username': this.state.ldapUsername, 
          'login-password': this.state.ldapPassword,
          ldapHost: this.state.ldapHost,
          ldapBindDN: this.state.ldapBindDN,
        })
        .then(function (res) {
          if (res.data && res.data.success) helpers.UI.showSnackbar('Mapping success')
        })
        .catch(function (err) {
          Log.error(err)
          helpers.UI.showSnackbar(err, true)
        })
    window.location.href = `${this.siteURL}/settings/accounts`;
    // window.location.reload(true)
  }


  onFormSubmit(e) {
    e.preventDefault()

    const ldapSettings = [
      // { name: 'ldapSettings:enable', value: this.state.ldapEnabled * 60000 },
      { name: 'ldapSettings:host', value: this.state.ldapHost },
      // { name: 'ldapSettings:port', value: this.state.ldapPort },
      { name: 'ldapSettings:bindDN', value: this.state.ldapBindDN },
      { name: 'ldapSettings:password', value: this.state.ldapPassword },
      // { name: 'ldapSettings:username', value: this.state.ldapUsername },
      // { name: 'ldapSettings:password', value: this.state.ldapPassword },
    ]
    this.props.updateMultipleSettings(ldapSettings);
    this.updateMapping(this.state.mapping);
    window.location.href = `${this.siteURL}/settings/accounts`;
  }


  render() {
    this.siteURL = this.getSetting('siteurl');
    const ldapGArray = this.getLDAPGroups();
    const rolesName = this.getRoles();
    let checkNowDisabled = true;
    if (this.getSetting('ldapSettings') && this.getSetting('ldapSettings') !== ''
      &&
      this.getSetting('ldapHost') && this.getSetting('ldapHost') !== ''
      &&
      this.getSetting('ldapBindDN') && this.getSetting('ldapBindDN') !== ''
      &&
      this.getSetting('ldapPassword') && this.getSetting('ldapPassword') !== ''
    ){
      checkNowDisabled = false;
    } else {
      checkNowDisabled = true;
    }

    const ElementArray = ({ role }) => {
      const roleGroup = role;
      return <ZoneBox>
        <SettingSubItem
          title={role.name}
          value={role._id}
          component={
            <SingleSelect
              width='60%'
              showTextbox={false}
              items={ldapGArray}
              defaultValue={roleGroup.ldapGroupID}
              disabled={this.state.ldapEnabled}
              onSelectChange={(e) => {
                this.addToMap(e, roleGroup, e.target.value)
              }}
            />
          }
        />
      </ZoneBox>
    }
    // fillInTheListOfRoles();

    // const ldapGroupsName = this. getLDAPGroups();
    const { active } = this.props
    return (

      <div className={active ? 'active' : 'hide'}>

        <SettingItem
          title='Allow User Registration'
          subtitle='Allow users to create accounts on the login screen.'
          component={
            <EnableSwitch
              stateName='allowUserRegistration'
              label='Enable'
              checked={this.allowUserRegistrationEnabled}
              onChange={e => {
                this.updateSetting('allowUserRegistration', 'allowUserRegistration:enable', e.target.checked)
              }}
            />
          }
        />
        <SettingItem
          title={'Password Complexity'}
          subtitle={'Require users passwords to meet minimum password complexity'}
          tooltip={'Minimum 8 characters with uppercase and numeric.'}
          component={
            <EnableSwitch
              stateName={'accountsPasswordComplexity'}
              label={'Enable'}
              checked={this.passwordComplexityEnabled}
              onChange={e => {
                this.updateSetting('accountsPasswordComplexity', 'accountsPasswordComplexity:enable', e.target.checked)
              }}
            />
          }
        />

        <SettingItem
          title={'LDAP Settings'}
          // subtitle={'Require users passwords to meet minimum password complexity'}
          // tooltip={'Minimum 8 characters with uppercase and numeric.'}
          component={
            <EnableSwitch
              stateName={'ldapSettings'}
              label={'Enable'}
              checked={this.ldapEnabled}
              onChange={e => {
                this.state.ldapEnabled = !this.state.ldapEnabled
                this.updateSetting('ldapSettings', 'ldapSettings:enable', e.target.checked)
              }}
            />
          }
        >
          <div>
            <form onSubmit={e => this.onFormSubmit(e)}>
              <div className='uk-margin-medium-bottom'>
                <label>LDAP Server</label>
                <input
                  type='text'
                  className={'md-input md-input-width-medium'}
                  name={'ldapHost'}
                  value={this.state.ldapHost}
                  disabled={this.state.ldapEnabled}
                  onChange={e => this.onInputValueChanged(e, 'ldapHost')}
                />
              </div>
              <div className='uk-margin-medium-bottom'>
                <label>LDAP Login</label>
                <input
                  type='text'
                  className={'md-input md-input-width-medium'}
                  name={'ldapBindDN'}
                  value={this.state.ldapBindDN}
                  disabled={this.state.ldapEnabled}
                  onChange={e => this.onInputValueChanged(e, 'ldapBindDN')}
                />
              </div>
              <div className='uk-margin-medium-bottom'>
                <label>LDAP Password</label>
                <input
                  type='password'
                  className={'md-input md-input-width-medium'}
                  name={'ldapPassword'}
                  value={this.state.ldapPassword}
                  disabled={this.state.ldapEnabled}
                  onChange={e => this.onInputValueChanged(e, 'ldapPassword')}
                />
              </div>
              {/* <div className='uk-margin-medium-bottom'>
                <label>LDAP Username</label>
                <input
                  type='text'
                  className={'md-input md-input-width-medium'}
                  name={'ldapUsername'}
                  value={this.state.ldapUsername}
                  onChange={e => this.onInputValueChanged(e, 'ldapUsername')}
                // disabled={!this.getSetting('mailerCheckEnabled')}
                />
              </div> */}
              <Zone>
                {rolesName.map(el => <ElementArray role={el} />)}
              </Zone>
              <div className='uk-clearfix' style={{ paddingTop: '1%' }}>
                <Button
                  text={'Check Now'}
                  type={'button'}
                  extraClass={'uk-float-left'}
                  flat={true}
                  waves={true}
                  style={'primary'}
                  onClick={e => this.onCheckNowClicked(e)}
                  disabled={checkNowDisabled}
                />
                <Button
                  text={'Apply'}
                  type={'submit'}
                  extraClass={'uk-float-right'}
                  flat={true}
                  waves={true}
                  style={'success'}
                  disabled={this.state.ldapEnabled}
                />

              </div>
            </form>
          </div>
        </SettingItem>
      </div>
    )
  }
}

AccountsSettingsContainer.propTypes = {
  active: PropTypes.bool.isRequired,
  updateSetting: PropTypes.func.isRequired,
  updateMultipleSettings: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  ldapGroups: PropTypes.object.isRequired,
  fetchLDAPGroups: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
  settings: state.settings.settings,
  roles: state.shared.roles,
  ldapGroups: state.shared.ldapGroups
})

export default connect(mapStateToProps, { updateSetting, updateMultipleSettings, fetchRoles, fetchLDAPGroups, fetchSettings })(AccountsSettingsContainer)
