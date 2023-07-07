import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchSettings, updateSetting } from 'actions/settings'
import PageTitle from 'components/PageTitle'
import Breadcrumbs from 'components/Breadcrumbs'
import SettingItem from 'components/Settings/SettingItem'
import Zone from 'components/ZoneBox/zone'
import ZoneBox from 'components/ZoneBox'
import SettingSubItem from 'components/Settings/SettingSubItem'
import InputWithSave from 'components/Settings/InputWithSave'
import SingleSelect from 'components/SingleSelect'
import moment from 'moment-timezone'
import TitleContext from 'app/TitleContext'
import { Helmet } from 'react-helmet-async'

class SettingsTimeAndDate extends React.Component {
  componentDidMount () {
    this.props.fetchSettings()
  }

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
    const Timezone = (
      <SingleSelect
        stateName='timezone'
        settingName='gen:timezone'
        items={this.getTimezones()}
        defaultValue={this.getSettingsValue('timezone')}
        onSelectChange={e => {
          this.onTimezoneChange(e)
        }}
        showTextbox={true}
      />
    )

    return (
      <div>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Time & Date</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageTitle
          breadcrumbs={
            <Breadcrumbs
              links={[
                { url: '/v2settings', title: 'Settings' },
                { url: '/v2settings/timeanddate', title: 'Time & Date', active: true }
              ]}
              classes={['uk-width-1-1']}
            />
          }
        />
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ flexGrow: 1, padding: 15 }}>
            <SettingItem
              title='Server Timezone'
              subtitle='Set the local server timezone for date display'
              tooltip='Requires server restart'
              component={Timezone}
            />
            <SettingItem
              title='Time & Date Format'
              subtitle={
                <a href='https://momentjs.com/docs/#/displaying/format/' rel='noopener noreferrer' target='_blank'>
                  Moment.js Format Options
                </a>
              }
            >
              <Zone>
                <ZoneBox>
                  <SettingSubItem
                    title='Time Format'
                    subtitle='Set the format for time display'
                    component={
                      <InputWithSave
                        stateName='timeFormat'
                        settingName='gen:timeFormat'
                        initialValue={this.getSettingsValue('timeFormat')}
                        width={'60%'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Short Date Format'
                    subtitle='Set the format for short dates'
                    component={
                      <InputWithSave
                        stateName='shortDateFormat'
                        settingName='gen:shortDateFormat'
                        initialValue={this.getSettingsValue('shortDateFormat')}
                        width={'60%'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Long Date Format'
                    subtitle='Set the format for long dates'
                    component={
                      <InputWithSave
                        stateName='longDateFormat'
                        settingName='gen:longDateFormat'
                        initialValue={this.getSettingsValue('longDateFormat')}
                        width={'60%'}
                      />
                    }
                  />
                </ZoneBox>
              </Zone>
            </SettingItem>
          </div>
          <div className={'info-sidebar'}>
            <h3>Server Timezone</h3>
            <p>
              Set the local server timezone for date and time display. This is a fallback option when the user has not
              specified a timezone within their profile section.
              <i style={{ display: 'block' }}>Changes requires server restart</i>
            </p>
            <h3>Time & Date Format</h3>
            <p>
              Time & Date Format allows you to customized the format used used when displaying time and date. Formatting
              options are found on the{' '}
              <a href='https://momentjs.com/docs/#/displaying/format/' rel='noopener noreferrer' target='_blank'>
                Moment.js
              </a>{' '}
              website. This setting is applied to all users.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

SettingsTimeAndDate.propTypes = {
  fetchSettings: PropTypes.func.isRequired,
  updateSetting: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { fetchSettings, updateSetting })(SettingsTimeAndDate)
