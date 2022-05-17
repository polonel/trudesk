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
class ServerSettingsController extends React.Component {
  @observable maintenanceModeEnabled = false

  constructor (props) {
    super(props)

    makeObservable(this)

    this.state = {
      restarting: false
    }

    this.restartServer = this.restartServer.bind(this)
  }

  componentDidMount () {
    // helpers.UI.inputs()
  }

  componentDidUpdate (prevProps) {
    // helpers.UI.reRenderInputs()
    if (prevProps.settings !== this.props.settings) {
      if (this.maintenanceModeEnabled !== this.getSetting('maintenanceMode'))
        this.maintenanceModeEnabled = this.getSetting('maintenanceMode')
    }
  }

  restartServer () {
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

  getSetting (stateName) {
    return this.props.settings.getIn(['settings', stateName, 'value'])
      ? this.props.settings.getIn(['settings', stateName, 'value'])
      : ''
  }

  onMaintenanceModeChange (e) {
    const self = this
    const val = e.target.checked

    if (val === true) {
      UIKit.modal.confirm(
        `<h2>Are you sure?</h2>
        <p style="font-size: 15px;">
            <span class="uk-text-danger" style="font-size: 15px;">This will force logout every user and prevent non-administrators from logging in.</span> 
        </p>
        `,
        () => {
          this.props
            .updateSetting({
              name: 'maintenanceMode:enable',
              value: val,
              stateName: 'maintenanceMode',
              noSnackbar: true
            })
            .then(() => {
              self.maintenanceModeEnabled = val
            })
        },
        {
          labels: { Ok: 'Yes', Cancel: 'No' },
          confirmButtonClass: 'md-btn-danger'
        }
      )
    } else {
      this.props
        .updateSetting({ name: 'maintenanceMode:enable', value: val, stateName: 'maintenanceMode', noSnackbar: true })
        .then(() => {
          self.maintenanceModeEnabled = val
        })
    }
  }

  render () {
    const { active } = this.props
    return (
      <div className={active ? 'active' : 'hide'}>
        <SettingItem
          title={'Restart Server'}
          subtitle={'Restart the Trudesk Instance. '}
          component={
            <Button
              text={'Restart'}
              flat={false}
              waves={true}
              style={'danger'}
              extraClass={'right mt-8 mr-5'}
              onClick={this.restartServer}
              disabled={this.state.restarting}
            />
          }
        />
        <SettingItem
          title={'Maintenance Mode'}
          subtitle={'Only Administrators are allowed to login.'}
          component={
            <EnableSwitch
              stateName={'maintenanceMode'}
              label={'Enable'}
              checked={this.maintenanceModeEnabled}
              onChange={e => this.onMaintenanceModeChange(e)}
            />
          }
        />
      </div>
    )
  }
}

ServerSettingsController.propTypes = {
  active: PropTypes.bool.isRequired,
  updateSetting: PropTypes.func.isRequired,
  updateMultipleSettings: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { updateSetting, updateMultipleSettings })(ServerSettingsController)
