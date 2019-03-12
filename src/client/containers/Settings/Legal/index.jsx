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
 *  Updated:    2/9/19 1:37 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Button from 'components/Button'
import EasyMDE from 'components/EasyMDE'
import { updateSetting } from 'actions/settings'

import helpers from 'lib/helpers'
import SettingItem from 'components/Settings/SettingItem'

class LegalSettingsContainer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      privacyPolicy: ''
    }
  }

  getSetting (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  onSavePrivacyPolicyClicked (e) {
    e.preventDefault()
    this.props
      .updateSetting({
        stateName: 'privacyPolicy',
        name: 'legal:privacypolicy',
        value: this.state.privacyPolicy,
        noSnackbar: true
      })
      .then(() => {
        helpers.UI.showSnackbar('Privacy Policy Updated')
      })
  }

  render () {
    const { active } = this.props
    return (
      <div className={!active ? 'hide' : ''}>
        <SettingItem title={'Privacy Policy'} subtitle={'Paste in HTML/Text of your privacy policy.'}>
          <div>
            <EasyMDE
              defaultValue={this.getSetting('privacyPolicy')}
              onChange={v => this.setState({ privacyPolicy: v })}
            />
          </div>
          <div className='uk-clearfix'>
            <Button
              text={'Save'}
              extraClass={'uk-float-right'}
              flat={true}
              style={'success'}
              waves={true}
              onClick={e => this.onSavePrivacyPolicyClicked(e)}
            />
          </div>
        </SettingItem>
      </div>
    )
  }
}

LegalSettingsContainer.propTypes = {
  active: PropTypes.bool,
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(
  mapStateToProps,
  { updateSetting }
)(LegalSettingsContainer)
