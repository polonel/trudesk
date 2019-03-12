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
 *  Updated:    3/3/19 1:03 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { updateSetting } from 'actions/settings'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import Log from '../../../logger'
import axios from 'axios'

import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'
import SplitSettingsPanel from 'components/Settings/SplitSettingsPanel'

import helpers from 'lib/helpers'
import Zone from 'components/ZoneBox/zone'
import ZoneBox from 'components/ZoneBox'

const templateBody = ({ template, handleSaveSubject, handleOpenEditor }) => (
  <div>
    <h3 className={'font-light mb-5'}>Template Description</h3>
    <p className='mb-10' style={{ fontSize: '13px' }}>
      {template.description}
    </p>
    <hr className='uk-margin-medium-bottom' />
    <form onSubmit={handleSaveSubject}>
      <input name={'id'} type='hidden' value={template._id} />
      <div className='uk-input-group'>
        <div className='md-input-wrapper'>
          <label>Mail Subject</label>
          <input name={'subject'} type='text' className={'md-input'} defaultValue={template.subject} />
        </div>
        <span className='uk-input-group-addon'>
          <Button type={'submit'} text={'Save'} small={true} />
        </span>
      </div>
    </form>

    <Zone extraClass={'uk-margin-medium-top'}>
      <ZoneBox>
        <div className={'uk-float-left'}>
          <h6 style={{ margin: 0, fontSize: '16px', lineHeight: '14px' }}>Edit Template</h6>
          <h5 className={'uk-text-muted'} style={{ margin: '2px 0 0 0', fontSize: '12px' }}>
            Customize template
          </h5>
        </div>
        <div className='uk-float-right uk-width-1-3 uk-clearfix'>
          <div className='uk-width-1-1 uk-float-right' style={{ textAlign: 'right' }}>
            <button
              className={'md-btn md-btn-small right'}
              style={{ textTransform: 'none' }}
              onClick={handleOpenEditor}
            >
              Open Editor
            </button>
          </div>
        </div>
      </ZoneBox>
    </Zone>
  </div>
)

templateBody.propTypes = {
  template: PropTypes.object.isRequired,
  handleSaveSubject: PropTypes.func.isRequired,
  handleOpenEditor: PropTypes.func.isRequired
}

@observer
class MailerSettings_Templates extends React.Component {
  @observable betaEnabled = false
  @observable templates = []

  componentDidMount () {
    helpers.UI.inputs()
  }

  componentDidUpdate (prevProps) {
    helpers.UI.reRenderInputs()
    if (prevProps.settings !== this.props.settings) {
      if (this.betaEnabled !== this.getSetting('emailBeta')) this.betaEnabled = this.getSetting('emailBeta')
      if (this.props.settings.get('mailTemplates').toArray() !== this.templates) {
        this.templates = this.props.settings.get('mailTemplates').toArray()
      }
    }
  }

  getSetting (name) {
    return this.props.settings.getIn(['settings', name, 'value']) !== undefined
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  onEmailBetaChange (e) {
    const self = this
    const val = e.target.checked
    this.props.updateSetting({ name: 'beta:email', value: val, stateName: 'betaEmail', noSnackbar: true }).then(() => {
      self.betaEnabled = val
    })
  }

  onSaveSubject (e) {
    e.preventDefault()
    const subject = e.target.subject
    if (!subject) return
    axios
      .put(`/api/v1/settings/mailer/template/${e.target.id.value}`, {
        subject: subject.value
      })
      .then(res => {
        if (res.data && res.data.success) helpers.UI.showSnackbar('Template subject saved successfully')
      })
      .catch(error => {
        const errorText = error.response ? error.response.error : error
        helpers.UI.showSnackbar(`Error: ${errorText}`, true)
        Log.error(errorText, error)
      })
  }

  static onOpenEditor (e, name) {
    e.preventDefault()
    const url = `/settings/editor/${name}/`
    History.pushState(null, null, url)
  }

  mapTemplateMenu () {
    return this.templates.map((template, idx) => {
      const templateJS = template.toJS()
      return {
        key: idx,
        title: template.get('displayName'),
        bodyComponent: templateBody({
          template: templateJS,
          handleSaveSubject: e => this.onSaveSubject(e),
          handleOpenEditor: e => MailerSettings_Templates.onOpenEditor(e, templateJS.name)
        })
      }
    })
  }

  render () {
    const mappedValues = this.mapTemplateMenu()
    return (
      <div>
        <SettingItem
          title={'Enable New Email Templates'}
          subtitle={
            <div>
              The new email notification system is currently in beta. Please See{' '}
              <a href='https://forum.trudesk.io/t/beta-email-notification-templates'>Email Notification Templates</a>{' '}
              for more information.
            </div>
          }
          component={
            <EnableSwitch
              stateName={'emailBeta'}
              label={'Enable'}
              checked={this.betaEnabled}
              onChange={e => this.onEmailBetaChange(e)}
            />
          }
        />
        <SplitSettingsPanel
          title={'Notification Templates'}
          subtitle={
            <div>
              Customize email notification templates.
              <strong> Note: Not all templates have been converted for the beta</strong>
            </div>
          }
          rightComponent={<h4 className={'uk-display-block uk-text-danger mt-20 mr-20'}>BETA FEATURE</h4>}
          menuItems={mappedValues}
        />
      </div>
    )
  }
}

MailerSettings_Templates.propTypes = {
  updateSetting: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(
  mapStateToProps,
  { updateSetting }
)(MailerSettings_Templates)
