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
 *  Updated:    9/18/21 11:41 AM
 *  Copyright (c) 2014-2021. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { updateSetting, updateMultipleSettings } from 'actions/settings'


import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'

import helpers from 'lib/helpers'
import axios from 'axios'
import Log from '../../../logger'
import EnableSwitch from 'components/Settings/EnableSwitch'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import UIKit from 'uikit'

@observer
class ChatwootSettingsController extends React.Component {
  @observable chatwootEnabled = false
  constructor(props) {
    super(props)

    makeObservable(this)

    this.state = {
      chatwootTemplateMessage: ''
    }

  }

  componentDidMount() {
    // helpers.UI.inputs()
  }

  updateSetting(stateName, name, value) {
    this.props.updateSetting({ stateName, name, value })
  }

  componentDidUpdate(prevProps) {
    // helpers.UI.reRenderInputs()
    if (prevProps.settings !== this.props.settings) {
      if (this.chatwootEnabled !== this.getSetting('chatwootSettings'))
        this.chatwootEnabled = this.getSetting('chatwootSettings')
      if (this.state.chatwootTemplateMessage !== this.getSetting('chatwootTemplateMessage'))
        this.state.chatwootTemplateMessage = this.getSetting('chatwootTemplateMessage')
    }
  }

  onInputValueChanged(e, stateName) {
    this.setState({
      [stateName]: e.target.value
    })
  }

  getSetting(stateName) {
    return this.props.settings.getIn(['settings', stateName, 'value'])
      ? this.props.settings.getIn(['settings', stateName, 'value'])
      : ''
  }

  onFormSubmit(e) {
    e.preventDefault()

    const chatwootSettings = [
      { name: 'chatwootSettings:templateMessage', value: this.state.chatwootTemplateMessage }
    ]
    this.props.updateMultipleSettings(chatwootSettings);

  }

  render() {
    const { active } = this.props
    return (
      <div className={active ? 'active' : 'hide'}>
        <SettingItem
          title={'Integration'}
          subtitle={'Enable functionality for linking with chatwoot'}
          component={
            <EnableSwitch
              stateName={'chatwootSettings'}
              label={'Enable'}
              checked={this.chatwootEnabled}
              onChange={e => {
                this.updateSetting('chatwootSettings', 'chatwootSettings:enable', e.target.checked)
              }}
            />
          }
        >
        </SettingItem>
        <div className={active ? 'active' : 'hide'}>
          <div>
            <SettingItem
              title={'Template message'}
              tooltip={'Template Parameters: {numberPhone}, {ticketUrl}, {name}'}
            >
              <form onSubmit={e => this.onFormSubmit(e)}>
                <div className='uk-margin-medium-bottom'>

                  <textarea
                    type='text'
                    className={'md-input md-input-width-medium'}
                    name={''}
                    value={this.state.chatwootTemplateMessage}
                    onChange={e => this.onInputValueChanged(e, 'chatwootTemplateMessage')}
                    style={{ 'height': '200px' }}
                  // disabled={!this.getSetting('mailerCheckEnabled')}
                  />
                </div>
                <Button
                  text={'Apply'}
                  type={'submit'}
                  extraClass={'uk-float-right'}
                  flat={true}
                  waves={true}
                  style={'success'}
                // disabled={!this.getSetting('mailerCheckEnabled')}
                />
              </form>
            </SettingItem>

          </div>
        </div>
      </div>
    )
  }
}

ChatwootSettingsController.propTypes = {
  active: PropTypes.bool.isRequired,
  updateSetting: PropTypes.func.isRequired,
  updateMultipleSettings: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { updateSetting, updateMultipleSettings })(ChatwootSettingsController)
