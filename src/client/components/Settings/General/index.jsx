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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import moment from 'moment-timezone'
import { updateSetting } from 'actions/settings'

import SettingItem from 'components/Settings/subcomponents/SettingItem'

import InputWithSave from 'components/Settings/subcomponents/InputWithSave'
import SingleSelect from 'components/Settings/subcomponents/SingleSelect'
import EnableSwitch from 'components/Settings/subcomponents/EnableSwitch'
import SettingSubItem from 'components/Settings/subcomponents/SettingSubItem'

class GeneralSettings extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      viewData: window.trudesk.viewdata
    }
  }

  componentDidMount () {}

  getSettingsValue (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  updateSetting (stateName, name, value) {
    this.props.updateSetting({ stateName, name, value })
  }

  getTimezones () {
    return moment.tz
      .names()
      .map(function (name) {
        const year = new Date().getUTCFullYear()
        const timezoneAtBeginningOfyear = moment.tz(year + '-01-01', name)
        return {
          utc: timezoneAtBeginningOfyear.utcOffset(),
          text: '(GMT' + timezoneAtBeginningOfyear.format('Z') + ') ' + name,
          value: name
        }
      })
      .sort(function (a, b) {
        return a.utc - b.utc
      })
  }

  onTimezoneChange (e) {
    if (e.target.value) this.updateSetting('timezone', 'gen:timezone', e.target.value)
  }

  render () {
    const { active } = this.props

    const SiteTitle = (
      <InputWithSave stateName='siteTitle' settingName='gen:sitetitle' value={this.getSettingsValue('siteTitle')} />
    )

    const SiteUrl = (
      <InputWithSave stateName='siteUrl' settingName='gen:siteurl' value={this.getSettingsValue('siteUrl')} />
    )

    const Timezone = (
      <SingleSelect
        stateName='timezone'
        settingName='gen:timezone'
        items={this.getTimezones()}
        value={this.getSettingsValue('timezone')}
        onSelectChange={e => {
          this.onTimezoneChange(e)
        }}
      />
    )

    const AllowUserRegistration = (
      <EnableSwitch
        stateName='allowUserRegistration'
        label='Enable'
        checked={this.getSettingsValue('allowUserRegistration')}
        onChange={e => {
          this.updateSetting('allowUserRegistration', 'allowUserRegistration:enable', e.target.checked)
        }}
      />
    )

    return (
      <div className={active ? 'active' : 'hide'}>
        <SettingItem
          title='Site Title'
          subTitle={
            <div>
              Title of site. Used as page title. <i>default: Trudesk</i>
            </div>
          }
          component={SiteTitle}
        />
        <SettingItem
          title='Site Url'
          subTitle={
            <div>
              Publicly accessible URL of this site. <i>ex: {this.state.viewData.hosturl}</i>
            </div>
          }
          component={SiteUrl}
        />
        <SettingItem
          title='Time Zone'
          subTitle='Set the local timezone for date display'
          tooltip='Requires Server Restart'
          component={Timezone}
        />
        <SettingItem
          title='Time & Date Format'
          subTitle={
            <a href='https://momentjs.com/docs/#/displaying/format/' rel='noopener noreferrer' target='_blank'>
              Moment.js Format Options
            </a>
          }
        >
          <SettingSubItem
            title='Time Format'
            subTitle='Set the format for time display'
            component={
              <InputWithSave
                stateName='timeFormat'
                settingName='gen:timeFormat'
                value={this.getSettingsValue('timeFormat')}
                width={'60%'}
              />
            }
          />
          <SettingSubItem
            title='Short Date Format'
            subTitle='Set the format for short dates'
            component={
              <InputWithSave
                stateName='shortDateFormat'
                settingName='gen:shortDateFormat'
                value={this.getSettingsValue('shortDateFormat')}
                width={'60%'}
              />
            }
          />
          <SettingSubItem
            title='Long Date Format'
            subTitle='Set the format for long dates'
            component={
              <InputWithSave
                stateName='longDateFormat'
                settingName='gen:longDateFormat'
                value={this.getSettingsValue('longDateFormat')}
                width={'60%'}
              />
            }
          />
        </SettingItem>
        <SettingItem
          title='Allow User Registration'
          subTitle='Allow users to create accounts on the login screen.'
          component={AllowUserRegistration}
        />
      </div>
    )
  }
}

GeneralSettings.propTypes = {
  active: PropTypes.bool,
  updateSetting: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(
  mapStateToProps,
  { updateSetting }
)(GeneralSettings)
