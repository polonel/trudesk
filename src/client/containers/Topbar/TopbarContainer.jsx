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
 *  Updated:    2/10/19 12:41 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import { size } from 'lodash'

import { showModal } from 'actions/common'

import Dropdown from 'components/Drowdown'
import DropdownItem from 'components/Drowdown/DropdownItem'
import DropdownSeparator from 'components/Drowdown/DropdownSeperator'
import DropdownHeader from 'components/Drowdown/DropdownHeader'
import DropdownTrigger from 'components/Drowdown/DropdownTrigger'
import PDropdownTrigger from 'components/PDropdown/PDropdownTrigger'
import OffCanvasTrigger from 'components/OffCanvas/OffCanvasTrigger'
import NotificationsDropdownPartial from './notificationsDropdown'

import socket from 'lib/socket'
import ConversationsDropdownPartial from 'containers/Topbar/conversationsDropdown'
import OnlineUserListPartial from 'containers/Topbar/onlineUserList'

import helpers from 'lib/helpers'

@observer
class TopbarContainer extends React.Component {
  @observable notificationCount = 0
  @observable activeUserCount = 0

  constructor (props) {
    super(props)
    this.onSocketUpdateNotifications = this.onSocketUpdateNotifications.bind(this)
    this.onSocketUpdateUsers = this.onSocketUpdateUsers.bind(this)
  }

  componentDidMount () {
    socket.socket.on('updateNotifications', this.onSocketUpdateNotifications)
    socket.socket.on('updateUsers', this.onSocketUpdateUsers)

    // Call for an update on Mount
    socket.ui.updateNotifications()
    socket.ui.updateUsers()
  }

  componentWillUnmount () {
    socket.socket.off('updateNotifications', this.onSocketUpdateNotifications)
    socket.socket.off('updateUsers', this.onSocketUpdateUsers)
  }

  onSocketUpdateNotifications (data) {
    if (data.count !== this.notificationCount) this.notificationCount = data.count
  }

  onSocketUpdateUsers (data) {
    const count = size(data)
    if (count !== this.activeUserCount) this.activeUserCount = count
  }

  static onConversationsClicked (e) {
    e.preventDefault()

    socket.ui.socket.emit('updateMailNotifications') // Pointless right now - No Receiver on server
  }

  render () {
    const { viewdata, sessionUser } = this.props
    return (
      <div className={'uk-grid top-nav'}>
        <div className='uk-width-1-1'>
          <div className='top-bar' data-topbar>
            <div className='title-area uk-float-left'>
              <div className='logo'>
                <img src={viewdata.logoImage} alt='Logo' className={'site-logo'} />
              </div>
            </div>
            <section className='top-bar-section uk-clearfix'>
              <div className='top-menu uk-float-right'>
                <ul className='uk-subnav uk-margin-bottom-remove'>
                  {/* Start Create Ticket Perm */}
                  {sessionUser && helpers.canUser('tickets:create') && (
                    <div>
                      <li className='top-bar-icon nopadding'>
                        <button
                          title={'Create Ticket'}
                          className={'anchor'}
                          onClick={() => this.props.showModal('CREATE_TICKET')}
                        >
                          <i className='material-icons'>&#xE145;</i>
                        </button>
                      </li>
                      <li className='top-bar-icon nopadding'>
                        <i className='material-icons'>more_vert</i>
                      </li>
                    </div>
                  )}
                  {/* End Create Ticket Perm */}
                  <li className='top-bar-icon'>
                    <PDropdownTrigger target={'conversations'}>
                      <a
                        title={'Conversations'}
                        className='no-ajaxy uk-vertical-align'
                        onClick={e => TopbarContainer.onConversationsClicked(e)}
                      >
                        <i className='material-icons'>sms</i>
                      </a>
                    </PDropdownTrigger>
                  </li>
                  <li className='top-bar-icon'>
                    <PDropdownTrigger target={'notifications'}>
                      <a title={'Notifications'} className={'no-ajaxy uk-vertical-align'}>
                        <i className='material-icons'>&#xE88E;</i>
                        <span className={'alert uk-border-circle label ' + (this.notificationCount < 1 ? 'hide' : '')}>
                          {this.notificationCount}
                        </span>
                      </a>
                    </PDropdownTrigger>
                  </li>
                  <li className='top-bar-icon'>
                    <OffCanvasTrigger target={'online-user-list'}>
                      <a title={'Online Users'} className='no-ajaxy'>
                        <i className='material-icons'>perm_contact_calendar</i>
                        <span
                          className={
                            'online-user-count alert uk-border-circle label ' + (this.activeUserCount < 1 ? 'hide' : '')
                          }
                        >
                          {this.activeUserCount}
                        </span>
                      </a>
                    </OffCanvasTrigger>
                  </li>

                  <li className='profile-area profile-name'>
                    <span>{viewdata.loggedInAccount.fullname}</span>
                    <div className='uk-position-relative uk-display-inline-block'>
                      <DropdownTrigger pos={'bottom-right'}>
                        <a
                          href='#'
                          title={viewdata.loggedInAccount.fullname}
                          className={'profile-pic no-ajaxy uk-vertical-align-middle'}
                        >
                          <img
                            src={'/uploads/users/' + (viewdata.loggedInAccount.image || 'defaultProfile.jpg')}
                            alt='Profile Picture'
                          />
                        </a>
                        <Dropdown small={true}>
                          <DropdownHeader text={viewdata.loggedInAccount.fullname} />
                          <DropdownItem text='Profile' href={'/profile'} />
                          <DropdownSeparator />
                          <DropdownItem text={'Logout'} href={'/logout'} />
                        </Dropdown>
                      </DropdownTrigger>
                    </div>
                  </li>
                </ul>
                <NotificationsDropdownPartial shortDateFormat={viewdata.shortDateFormat} timezone={viewdata.timezone} />
                <ConversationsDropdownPartial shortDateFormat={viewdata.shortDateFormat} timezone={viewdata.timezone} />
              </div>
            </section>
          </div>
        </div>

        <OnlineUserListPartial timezone={viewdata.timezone} users={viewdata.users} />
      </div>
    )
  }
}

TopbarContainer.propTypes = {
  sessionUser: PropTypes.object,
  viewdata: PropTypes.object.isRequired,
  showModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser,
  viewdata: state.common
})

export default connect(
  mapStateToProps,
  { showModal }
)(TopbarContainer)
