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
 *  Updated:    2/8/19 1:13 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { updateSetting, updateMultipleSettings } from 'actions/settings'

import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'

import helpers from 'lib/helpers'

class TPSSettingsContainer extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tpsUsername: '',
      tpsApiKey: ''
    }
  }

  componentDidMount () {
    helpers.UI.inputs()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  static getDerivedStateFromProps (nextProps, state) {
    if (nextProps.settings) {
      let stateObj = { ...state }
      if (!state.tpsUsername)
        stateObj.tpsUsername = nextProps.settings.getIn(['settings', 'tpsUsername', 'value']) || ''
      if (!state.tpsApiKey) stateObj.tpsApiKey = nextProps.settings.getIn(['settings', 'tpsApiKey', 'value']) || ''

      return stateObj
    }

    return null
  }

  getSetting (stateName) {
    return this.props.settings.getIn(['settings', stateName, 'value'])
      ? this.props.settings.getIn(['settings', stateName, 'value'])
      : ''
  }

  onTPSEnabledChanged (e) {
    this.props.updateSetting({ stateName: 'tpsEnabled', name: 'tps:enable', value: e.target.checked, noSnackbar: true })
  }

  onInputChanged (e, stateName) {
    this.setState({
      [stateName]: e.target.value
    })
  }

  onFormSubmit (e) {
    e.preventDefault()
    const settings = [
      { name: 'tps:username', value: this.state.tpsUsername },
      { name: 'tps:apikey', value: this.state.tpsApiKey }
    ]

    this.props.updateMultipleSettings(settings)
  }

  render () {
    const { active } = this.props
    return (
      <div className={active ? 'active' : 'hide'}>
        <SettingItem
          title={'TPS'}
          subtitle={
            <div>
              Trudesk Push Service authentication for mobile push notifications.
              <a href='http://push.trudesk.io/signup' rel='noopener noreferrer' target='_blank'>
                Get API Key
              </a>
            </div>
          }
          component={
            <EnableSwitch
              stateName={'tpsEnabled'}
              label={'Enable'}
              checked={this.getSetting('tpsEnabled')}
              onChange={e => this.onTPSEnabledChanged(e)}
            />
          }
        >
          <form onSubmit={e => this.onFormSubmit(e)}>
            <div className='uk-margin-medium-bottom'>
              <label>Username</label>
              <input
                type='text'
                className={'md-input md-input-width-medium'}
                value={this.state.tpsUsername}
                disabled={!this.getSetting('tpsEnabled')}
                onChange={e => this.onInputChanged(e, 'tpsUsername')}
              />
            </div>
            <div className='uk-margin-medium-bottom'>
              <label>API Key</label>
              <input
                type='text'
                className={'md-input md-input-width-medium'}
                value={this.state.tpsApiKey}
                disabled={!this.getSetting('tpsEnabled')}
                onChange={e => this.onInputChanged(e, 'tpsApiKey')}
              />
            </div>
            <div className='uk-clearfix'>
              <Button
                text={'Apply'}
                type={'submit'}
                flat={true}
                waves={true}
                disabled={!this.getSetting('tpsEnabled')}
                style={'success'}
                extraClass={'uk-float-right'}
              />
            </div>
          </form>
        </SettingItem>
      </div>
    )
  }
}

TPSSettingsContainer.propTypes = {
  active: PropTypes.bool.isRequired,
  updateSetting: PropTypes.func.isRequired,
  updateMultipleSettings: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(
  mapStateToProps,
  { updateSetting, updateMultipleSettings }
)(TPSSettingsContainer)
