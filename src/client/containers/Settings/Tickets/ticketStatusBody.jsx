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
 *  Updated:    6/20/23 6:00 PM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import Input from 'components/Input'
import { makeObservable, observable } from 'mobx'
import { fetchSettings } from 'actions/settings'
import { showModal, hideModal } from 'actions/common'
import ColorSelector from 'components/ColorSelector'
import Button from 'components/Button'
import EnableSwitch from 'components/Settings/EnableSwitch'

import api from 'api'
import helpers from 'lib/helpers'

@observer
class TicketStatusBody extends React.Component {
  @observable statusName = ''
  @observable htmlColor = ''
  @observable slatimer = ''
  @observable isResolved = ''
  constructor (props) {
    super(props)
    makeObservable(this)
  }

  componentDidMount () {
    this.statusName = this.props.status.get('name') || ''
    this.htmlColor = this.props.status.get('htmlColor') || ''
    this.isResolved = this.props.status.get('isResolved') || false
    this.slatimer = this.props.status.get('slatimer') || false
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (this.statusName === '') this.statusName = this.props.status.get('name') || ''
    if (this.htmlColor === '') this.htmlColor = this.props.status.get('htmlColor') || ''
    if (this.isResolved === '') this.isResolved = this.props.status.get('isResolved') || false
    if (this.slatimer === '') this.slatimer = this.props.status.get('slatimer') || false
  }

  onSaveClicked (e) {
    const id = this.props.status.get('_id')
    const name = this.statusName
    const htmlColor = this.htmlColor
    const isResolved = this.isResolved
    const slatimer = this.slatimer

    api.tickets
      .updateStatus({ id, name, htmlColor, isResolved, slatimer })
      .then(_res => {
        helpers.UI.showSnackbar('Status updated')
        this.props.fetchSettings()
      })
      .catch(e => {
        helpers.UI.showSnackbar(e, true)
      })
  }

  showDeleteTicketStatusModal (e, status) {
    this.props.showModal('DELETE_STATUS', { status })
  }

  render () {
    return (
      <div>
        <form>
          <div className={'ticket-status-general-wrapper'}>
            <h2 className='text-light'>General</h2>
            <hr style={{ margin: '5px 0 25px 0' }} />
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'inline-block', cursor: 'pointer' }}>Status Name</label>
              <Input defaultValue={this.statusName} onChange={v => (this.statusName = v)} />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'inline-block', cursor: 'pointer' }}>Status Color</label>
              <ColorSelector
                showLabel={false}
                hideRevert={true}
                defaultColor={this.htmlColor}
                onChange={e => (this.htmlColor = e.target.value)}
              />
            </div>
          </div>
          <h2 className='text-light mt-25'>Properties</h2>
          <hr style={{ margin: '5px 0 25px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <h4 className={'uk-width-1-2'} style={{ flexGrow: 1 }}>
              SLA Timer
            </h4>
            <EnableSwitch
              stateName={`slatimer_${this.props.status.get('_id')}`}
              label={'Yes'}
              checked={this.slatimer}
              onChange={e => (this.slatimer = e.target.checked)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <h4 className={'uk-width-1-2'} style={{ flexGrow: 1 }}>
              Is Resolved
            </h4>
            <EnableSwitch
              stateName={`isResolved_${this.props.status.get('_id')}`}
              label={'Yes'}
              checked={this.isResolved}
              onChange={e => (this.isResolved = e.target.checked)}
            />
          </div>
          <div className={'uk-margin-large-top'} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button text={'Save Status'} style={'success'} onClick={e => this.onSaveClicked(e)} />
          </div>
        </form>
        {!this.props.status.get('isLocked') && (
          <>
            <div className={'uk-margin-large-top'} style={{ display: 'block', height: 15 }} />
            <div className={'uk-margin-large-top'}>
              <h2 className='text-light'>Danger Zone</h2>
              <div className='danger-zone'>
                <div className='dz-box uk-clearfix'>
                  <div className='uk-float-left'>
                    <h5>Delete this status</h5>
                    <p>Once you delete a ticket status, there is no going back. Please be certain.</p>
                  </div>
                  <div className='uk-float-right' style={{ paddingTop: '10px' }}>
                    <Button
                      text={'Delete'}
                      small={true}
                      style={'danger'}
                      onClick={e => this.showDeleteTicketStatusModal(e, this.props.status)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
}

TicketStatusBody.propTypes = {
  status: PropTypes.object.isRequired,
  fetchSettings: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired
}

export default connect(null, { fetchSettings, showModal, hideModal })(TicketStatusBody)
