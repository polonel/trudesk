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

import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import { size } from 'lodash'

import { fetchViewData, showModal, hideModal, showNotice, clearNotice } from 'actions/common'

import Avatar from 'components/Avatar/Avatar'
import PDropdownTrigger from 'components/PDropdown/PDropdownTrigger'
import OffCanvasTrigger from 'components/OffCanvas/OffCanvasTrigger'
import NoticeBanner from 'components/NoticeBanner'
import NotificationsDropdownPartial from './notificationsDropdown'

import ProfileDropdownPartial from 'containers/Topbar/profileDropdown'
import ConversationsDropdownPartial from 'containers/Topbar/conversationsDropdown'
import OnlineUserListPartial from 'containers/Topbar/onlineUserList'
import DefaultLogoImageLight from '../../../../public/img/defaultLogoLight.png'
import DefaultLogoImageDark from '../../../../public/img/defaultLogoDark.png'
import helpers from 'lib/helpers'
import Cookies from 'jscookie'
import { NOTIFICATIONS_UPDATE, USERS_UPDATE, NOTICE_UI_SHOW, NOTICE_UI_CLEAR } from 'serverSocket/socketEventConsts'

import $ from 'jquery'

@observer
class TopbarContainer extends React.Component {
  conversationsDropdownPartial = createRef()
  notificationsDropdownPartial = createRef()
  profileDropdownPartial = createRef()

  @observable notificationCount = 0
  @observable activeUserCount = 0

  @observable showInfoBanner = true

  constructor (props) {
    super(props)
    makeObservable(this)

    this.onSocketUpdateNotifications = this.onSocketUpdateNotifications.bind(this)
    this.onSocketUpdateUsers = this.onSocketUpdateUsers.bind(this)

    this.onSocketShowNotice = this.onSocketShowNotice.bind(this)
    this.onSocketClearNotice = this.onSocketClearNotice.bind(this)
  }

  static onConversationsClicked (e) {
    e.preventDefault()
  }

  componentDidMount () {
    this.props.fetchViewData().then(() => {
      if (this.props.viewdata.get('notice'))
        this.showNotice(this.props.viewdata.get('notice').toJS(), this.props.viewdata.get('noticeCookieName'))

      $.event.trigger('trudesk:ready', window)
    })

    this.props.socket.on(NOTIFICATIONS_UPDATE, this.onSocketUpdateNotifications)
    this.props.socket.on(USERS_UPDATE, this.onSocketUpdateUsers)
    this.props.socket.on(NOTICE_UI_SHOW, this.onSocketShowNotice)
    this.props.socket.on(NOTICE_UI_CLEAR, this.onSocketClearNotice)

    // Call for an update on Mount
    this.props.socket.emit(NOTIFICATIONS_UPDATE)
    this.props.socket.emit(USERS_UPDATE)

    // this.shouldShowBanner()
  }

  componentWillUnmount () {
    this.props.socket.off(NOTIFICATIONS_UPDATE, this.onSocketUpdateNotifications)
    this.props.socket.off(USERS_UPDATE, this.onSocketUpdateUsers)
    this.props.socket.off(NOTICE_UI_SHOW, this.onSocketShowNotice)
    this.props.socket.off(NOTICE_UI_CLEAR, this.onSocketClearNotice)
  }

  shouldShowBanner () {
    const hasSeen = Cookies.get('trudesk_info_banner_closed') === 'true'
    if (hasSeen) this.showInfoBanner = false
  }

  closeInfo () {
    Cookies.set('trudesk_info_banner_closed', 'true')
    this.showInfoBanner = false
  }

  showNotice (notice, cookieName) {
    // We Will move this sooner or later to somewhere more appropriate
    this.props.showNotice(notice)

    if (cookieName) {
      const showNoticeWindow = Cookies.get(cookieName) !== 'false'
      if (showNoticeWindow)
        this.props.showModal('NOTICE_ALERT', {
          modalTag: 'NOTICE_ALERT',
          notice,
          noticeCookieName: cookieName,
          shortDateFormat: this.props.viewdata.get('shortDateFormat'),
          timeFormat: this.props.viewdata.get('timeFormat')
        })
    }
  }

  onSocketShowNotice (data) {
    this.props.showNotice(data)
    const cookieName = data.name + '_' + helpers.formatDate(data.activeDate, 'MMMDDYYYY_HHmmss')
    this.showNotice(data, cookieName)

    helpers.resizeAll()
  }

  onSocketClearNotice () {
    this.props.clearNotice()
    this.props.hideModal('NOTICE_ALERT')

    helpers.resizeAll()
  }

  onSocketUpdateNotifications (data) {
    if (data.count !== this.notificationCount) this.notificationCount = data.count
  }

  onSocketUpdateUsers (data) {
    delete data[this.props.sessionUser.username]
    const count = size(data)
    if (count !== this.activeUserCount) this.activeUserCount = count
  }

  render () {
    const { loadingViewData, viewdata, sessionUser } = this.props
    if (loadingViewData || !sessionUser) return <div className='top-nav' />
    return (
      <div>
        {this.props.notice && <NoticeBanner notice={this.props.notice} />}
        <div className={'uk-grid top-nav'}>
          <div className='uk-width-1-1'>
            <div className='top-bar' data-topbar>
              <div className='title-area uk-float-left'>
                <div className='logo'>
                  <img src={viewdata.get('logoImage')} alt='Logo' className={'site-logo'} />
                </div>
              </div>
              <section className='top-bar-section uk-clearfix'>
                <div className='top-menu uk-float-right'>
                  <ul className='uk-subnav uk-margin-bottom-remove'>
                    {/* Start Create Ticket Perm */}
                    {sessionUser && helpers.canUser('tickets:create') && (
                      <li className='top-bar-icon nopadding'>
                        <button
                          title={'Create Ticket'}
                          className={'anchor'}
                          onClick={() => this.props.showModal('CREATE_TICKET')}
                        >
                          <i className='material-icons'>&#xE145;</i>
                        </button>
                      </li>
                    )}
                    {sessionUser && helpers.canUser('tickets:create') && (
                      <li className='top-bar-icon nopadding nohover'>
                        <i className='material-icons separator'>remove</i>
                      </li>
                    )}
                    {/* End Create Ticket Perm */}
                    <li className='top-bar-icon'>
                      <PDropdownTrigger target={this.conversationsDropdownPartial}>
                        <a
                          title={'Conversations'}
                          className='no-ajaxy uk-vertical-align'
                          onClick={e => TopbarContainer.onConversationsClicked(e)}
                        >
                          <i className='material-icons'>question_answer</i>
                        </a>
                      </PDropdownTrigger>
                    </li>
                    <li className='top-bar-icon'>
                      <PDropdownTrigger target={this.notificationsDropdownPartial}>
                        <a title={'Notifications'} className={'no-ajaxy uk-vertical-align'}>
                          <i className='material-icons'>notifications</i>
                          <span
                            className={'alert uk-border-circle label ' + (this.notificationCount < 1 ? 'hide' : '')}
                          >
                            {this.notificationCount}
                          </span>
                        </a>
                      </PDropdownTrigger>
                    </li>
                    {/*<li className='top-bar-icon'>*/}
                    {/*  <OffCanvasTrigger target={'online-user-list'}>*/}
                    {/*    <a title={'Online Users'} className='no-ajaxy'>*/}
                    {/*      <i className='material-icons'>people_alt</i>*/}
                    {/*      <span*/}
                    {/*        className={*/}
                    {/*          'online-user-count alert uk-border-circle label ' +*/}
                    {/*          (this.activeUserCount < 1 ? 'hide' : '')*/}
                    {/*        }*/}
                    {/*      >*/}
                    {/*        {this.activeUserCount}*/}
                    {/*      </span>*/}
                    {/*    </a>*/}
                    {/*  </OffCanvasTrigger>*/}
                    {/*</li>*/}
                    <li className='top-bar-icon nopadding nohover'>
                      <i className='material-icons separator'>remove</i>
                    </li>

                    <li className='profile-area profile-name'>
                      <span style={{ fontSize: 16 }}>{sessionUser.fullname}</span>
                      <div className='uk-position-relative uk-display-inline-block'>
                        <PDropdownTrigger target={this.profileDropdownPartial}>
                          <a
                            href='#'
                            title={sessionUser.fullname}
                            className={'profile-pic no-ajaxy uk-vertical-align-middle'}
                          >
                            <Avatar
                              image={sessionUser.image}
                              showOnlineBubble={true}
                              userId={sessionUser._id}
                              size={35}
                              overrideBubbleSize={15}
                            />
                          </a>
                        </PDropdownTrigger>
                      </div>
                    </li>
                  </ul>
                  <NotificationsDropdownPartial
                    forwardedRef={this.notificationsDropdownPartial}
                    shortDateFormat={viewdata.get('shortDateFormat')}
                    timezone={viewdata.get('timezone')}
                    onViewAllNotificationsClick={() => this.props.showModal('VIEW_ALL_NOTIFICATIONS')}
                  />
                  <ConversationsDropdownPartial
                    forwardedRef={this.conversationsDropdownPartial}
                    shortDateFormat={viewdata.get('shortDateFormat')}
                    timezone={viewdata.get('timezone')}
                    socket={this.props.socket}
                  />
                  <ProfileDropdownPartial forwardedRef={this.profileDropdownPartial} />
                </div>
              </section>
            </div>
          </div>

          <OnlineUserListPartial
            timezone={viewdata.get('timezone')}
            users={viewdata.get('users').toArray()}
            sessionUser={this.props.sessionUser}
            socket={this.props.socket}
          />
        </div>
      </div>
    )
  }
}

TopbarContainer.propTypes = {
  socket: PropTypes.object.isRequired,
  sessionUser: PropTypes.object,
  fetchViewData: PropTypes.func.isRequired,
  loadingViewData: PropTypes.bool.isRequired,
  viewdata: PropTypes.object.isRequired,
  showModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  showNotice: PropTypes.func.isRequired,
  clearNotice: PropTypes.func.isRequired,
  notice: PropTypes.object
}

const mapStateToProps = state => ({
  socket: state.shared.socket,
  sessionUser: state.shared.sessionUser,
  notice: state.shared.notice,
  loadingViewData: state.common.loadingViewData,
  viewdata: state.common.viewdata
})

export default connect(mapStateToProps, { fetchViewData, showModal, hideModal, showNotice, clearNotice })(
  TopbarContainer
)
