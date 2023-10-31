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
 *  Updated:    2/7/19 1:36 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import Log from '../../../logger'
import { connect } from 'react-redux'
import { fetchSettings, updateSetting, updateMultipleSettings } from 'actions/settings'
import helpers from 'lib/helpers'

import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'
import TitleContext from 'app/TitleContext'
import { Helmet } from 'react-helmet-async'
import PageTitle from 'components/PageTitle'
import Breadcrumbs from 'components/Breadcrumbs'

class SettingsMailer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      mailerSSL: '',
      mailerHost: '',
      mailerPort: '',
      mailerUsername: '',
      mailerPassword: '',
      mailerFrom: ''
    }

    this.props.fetchSettings()
  }

  static getDerivedStateFromProps (nextProps, state) {
    if (nextProps.settings) {
      let stateObj = { ...state }
      if (state.mailerSSL === '')
        stateObj.mailerSSL = nextProps.settings.getIn(['settings', 'mailerSSL', 'value']) || ''
      if (!state.mailerHost) stateObj.mailerHost = nextProps.settings.getIn(['settings', 'mailerHost', 'value']) || ''
      if (!state.mailerPort) stateObj.mailerPort = nextProps.settings.getIn(['settings', 'mailerPort', 'value']) || ''
      if (!state.mailerUsername)
        stateObj.mailerUsername = nextProps.settings.getIn(['settings', 'mailerUsername', 'value']) || ''
      if (!state.mailerPassword)
        stateObj.mailerPassword = nextProps.settings.getIn(['settings', 'mailerPassword', 'value']) || ''
      if (!state.mailerFrom) stateObj.mailerFrom = nextProps.settings.getIn(['settings', 'mailerFrom', 'value']) || ''

      return stateObj
    }

    return null
  }

  componentDidMount () {
    helpers.UI.inputs()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  getSetting (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  onEnableMailerChanged (e) {
    this.props.updateSetting({
      name: 'mailer:enable',
      stateName: 'mailerEnabled',
      value: e.target.checked,
      noSnackbar: true
    })
  }

  onMailerSSLChanged (e) {
    this.setState({
      mailerSSL: e.target.checked
    })
  }

  onInputValueChanged (e, stateName) {
    this.setState({
      [stateName]: e.target.value
    })
  }

  onMailerSubmit (e) {
    e.preventDefault()

    const mailSettings = [
      { name: 'mailer:host', value: this.state.mailerHost },
      { name: 'mailer:port', value: this.state.mailerPort },
      { name: 'mailer:username', value: this.state.mailerUsername },
      { name: 'mailer:password', value: this.state.mailerPassword },
      { name: 'mailer:from', value: this.state.mailerFrom },
      { name: 'mailer:ssl', value: this.state.mailerSSL }
    ]

    this.props.updateMultipleSettings(mailSettings)
  }

  testMailerSettings (e) {
    e.preventDefault()
    helpers.UI.showSnackbar('Testing...')

    axios
      .post('/api/v1/settings/testmailer', {})
      .then(() => {
        helpers.UI.showSnackbar('Successfully Connected')
      })
      .catch(err => {
        if (!err.response) return Log.error(err)
        helpers.UI.showSnackbar('Connection Failed. Did you apply settings?', true)
        Log.error(err.response.data.error, err.response)
      })
  }

  render () {
    return (
      <div>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Mailer</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageTitle
          breadcrumbs={
            <Breadcrumbs
              links={[
                { url: '/v2settings', title: 'Settings' },
                { url: '/v2settings/mailer', title: 'Mailer', active: true }
              ]}
              classes={['uk-width-1-1']}
            />
          }
        />
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ flexGrow: 1, padding: 15 }}>
            <SettingItem
              title={'Mailer'}
              subtitle={'Preferences for trudesk to send email notifications to users.'}
              component={
                <EnableSwitch
                  stateName={'mailerEnabled'}
                  label={'Enabled'}
                  onChange={e => this.onEnableMailerChanged(e)}
                  checked={this.getSetting('mailerEnabled')}
                />
              }
            >
              <form onSubmit={e => this.onMailerSubmit(e)}>
                <div className={'uk-margin-medium-bottom'}>
                  <div className={'uk-right'}>
                    <EnableSwitch
                      stateName={'mailerSSL'}
                      label={'Use SSLv3'}
                      style={{ position: 'absolute', top: '5px', right: '-5px', zIndex: '99', margin: '0' }}
                      checked={this.state.mailerSSL}
                      disabled={!this.getSetting('mailerEnabled')}
                      onChange={e => this.onMailerSSLChanged(e)}
                    />
                  </div>
                  <label>Mail Server</label>
                  <input
                    type='text'
                    className={'md-input md-input-width-medium'}
                    name={'mailerHost'}
                    disabled={!this.getSetting('mailerEnabled')}
                    value={this.state.mailerHost}
                    onChange={e => this.onInputValueChanged(e, 'mailerHost')}
                  />
                </div>
                <div className='uk-margin-medium-bottom'>
                  <label>Port</label>
                  <input
                    type='text'
                    className={'md-input md-input-width-medium'}
                    name={'mailerPort'}
                    disabled={!this.getSetting('mailerEnabled')}
                    value={this.state.mailerPort}
                    onChange={e => this.onInputValueChanged(e, 'mailerPort')}
                  />
                </div>
                <div className='uk-margin-medium-bottom'>
                  <label>Auth Username</label>
                  <input
                    type='text'
                    className={'md-input md-input-width-medium'}
                    name={'mailerUsername'}
                    disabled={!this.getSetting('mailerEnabled')}
                    value={this.state.mailerUsername}
                    onChange={e => this.onInputValueChanged(e, 'mailerUsername')}
                  />
                </div>
                <div className='uk-margin-medium-bottom'>
                  <label>Auth Password</label>
                  <input
                    type='password'
                    className={'md-input md-input-width-medium'}
                    name={'mailerPassword'}
                    disabled={!this.getSetting('mailerEnabled')}
                    value={this.state.mailerPassword}
                    onChange={e => this.onInputValueChanged(e, 'mailerPassword')}
                  />
                </div>
                <div className='uk-margin-medium-bottom'>
                  <label>From Address</label>
                  <input
                    type='text'
                    className={'md-input md-input-width-medium'}
                    name={'mailerFrom'}
                    disabled={!this.getSetting('mailerEnabled')}
                    value={this.state.mailerFrom}
                    onChange={e => this.onInputValueChanged(e, 'mailerFrom')}
                  />
                </div>
                <div className='uk-clearfix'>
                  <Button
                    text={'Test Settings'}
                    type={'button'}
                    flat={true}
                    waves={true}
                    style={'primary'}
                    extraClass={'uk-float-left'}
                    disabled={!this.getSetting('mailerEnabled')}
                    onClick={e => this.testMailerSettings(e)}
                  />
                  <Button
                    text={'Apply'}
                    type={'submit'}
                    style={'success'}
                    extraClass={'uk-float-right'}
                    disabled={!this.getSetting('mailerEnabled')}
                    waves={true}
                    flat={true}
                  />
                </div>
              </form>
            </SettingItem>
          </div>
          <div className={'info-sidebar'}>
            <h3>Mail Server</h3>
            <p>Hostname or IP Address of the SMTP server used to send mail.</p>
            <h3>Port</h3>
            <p>Port used to connect to the SMTP server.</p>
            <h3>Auth Username/Password</h3>
            <p>Username and Password for SMTP authentication.</p>
            <h3>From Address</h3>
            <p>Enter the email address used as the FROM address when sending mail.</p>
          </div>
        </div>
      </div>
    )
  }
}

SettingsMailer.propTypes = {
  settings: PropTypes.object.isRequired,
  fetchSettings: PropTypes.func.isRequired,
  updateSetting: PropTypes.func.isRequired,
  updateMultipleSettings: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { fetchSettings, updateSetting, updateMultipleSettings })(SettingsMailer)
