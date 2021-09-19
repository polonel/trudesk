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

class ServerSettingsController extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      restarting: false
    }

    this.restartServer = this.restartServer.bind(this)
  }

  componentDidMount () {
    // helpers.UI.inputs()
  }

  componentDidUpdate () {
    // helpers.UI.reRenderInputs()
  }

  // static getDerivedStateFromProps (nextProps, state) {
  //   if (nextProps.settings) {
  //     let stateObj = { ...state }
  //     if (!state.tpsUsername)
  //       stateObj.tpsUsername = nextProps.settings.getIn(['settings', 'tpsUsername', 'value']) || ''
  //     if (!state.tpsApiKey) stateObj.tpsApiKey = nextProps.settings.getIn(['settings', 'tpsApiKey', 'value']) || ''
  //
  //     return stateObj
  //   }
  //
  //   return null
  // }

  restartServer () {
    this.setState({ restarting: true })

    axios
      .get('/api/v1/admin/restart')
      .catch(error => {
        helpers.hideLoader()
        Log.error(error.response)
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
