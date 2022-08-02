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
 *  Updated:    2/12/19 11:49 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-timezone'
import { observer } from 'mobx-react'
import { observable, entries, makeObservable, configure } from 'mobx'
import { isUndefined } from 'lodash'

import { MESSAGES_SPAWN_CHAT_WINDOW } from 'serverSocket/socketEventConsts'
import { startConversation } from 'lib/chat'

import OffCanvas from 'components/OffCanvas'

import UIkit from 'uikit'

@observer
class OnlineUserListPartial extends React.Component {
  @observable activeUsers = new Map()

  constructor (props) {
    super(props)
    configure({ enforceActions: 'never' })
    makeObservable(this)

    this.onSocketUpdateUsers = this.onSocketUpdateUsers.bind(this)
  }

  componentDidMount () {
    this.props.socket.on('updateUsers', this.onSocketUpdateUsers)
  }

  componentWillUnmount () {
    this.props.socket.off('updateUsers', this.onSocketUpdateUsers)
  }

  onSocketUpdateUsers (data) {
    this.activeUsers.replace(data)
  }

  isActiveUser (username) {
    return !!this.activeUsers.get(username)
  }

  onUserClicked (e, _id) {
    e.preventDefault()
    UIkit.offcanvas.hide()

    startConversation(this.props.sessionUser._id, _id).then(conversation => {
      this.props.socket.emit(MESSAGES_SPAWN_CHAT_WINDOW, { convoId: conversation._id })
    })
  }

  fromNow (timezone, date) {
    if (isUndefined(date)) {
      return 'Never'
    }
    moment.updateLocale('en', {
      relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        m: '1m',
        mm: '%dm',
        h: '1h',
        hh: '%dh',
        d: '1d',
        dd: '%dd',
        M: '1mo',
        MM: '%dmos',
        y: '1y',
        yy: '%dyrs'
      }
    })

    return moment
      .utc(date)
      .tz(timezone)
      .fromNow()
  }

  render () {
    const { timezone, users } = this.props
    return (
      <OffCanvas title={'Online Users'} id={'online-user-list'}>
        <div style={{ padding: '0 5px' }}>
          <div className='active-now'>
            <h5>Active Now</h5>
            <div className='online-list-wrapper'>
              <ul className='online-list'>
                {entries(this.activeUsers).map(([key, value]) => {
                  if (this.props.sessionUser && value.user._id === this.props.sessionUser._id) return null
                  const image = value.user.image || 'defaultProfile.jpg'
                  const isAgentOrAdmin = value.user.role.isAdmin || value.user.role.isAgent
                  return (
                    <li key={key}>
                      <a className={'no-ajaxy'} onClick={e => this.onUserClicked(e, value.user._id)}>
                        <div className='user-list-user'>
                          <div className='image'>
                            <img src={`/uploads/users/${image}`} alt='Profile Pic' />
                          </div>
                          <span className='online-status' data-user-status-id={value.user._id} />
                          <div className={'user-name' + (isAgentOrAdmin ? ' _agent' : '')}>
                            {value.user.fullname + (isAgentOrAdmin ? ' - Agent' : '')}
                          </div>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <h5>More Conversations</h5>
          <div className='user-list-wrapper' style={{ lineHeight: 'normal' }}>
            <div
              className='online-list-search-box search-box'
              style={{ borderTop: '1px solid rgba(0,0,0,0.1)', borderRight: 'none' }}
            >
              <input type='text' placeholder={'Search'} />
            </div>
            <ul className='user-list'>
              {users.map(user => {
                if (this.props.sessionUser && user._id === this.props.sessionUser._id) return null
                const image = user.get('image') || 'defaultProfile.jpg'
                return (
                  <li key={user.get('_id')} data-search-term={user.get('fullname').toLowerCase()}>
                    <a className='no-ajaxy' onClick={e => OnlineUserListPartial.onUserClicked(e, user.get('_id'))}>
                      <div className='user-list-user'>
                        <div className='image'>
                          <img src={`/uploads/users/${image}`} alt='Profile Picture' />
                        </div>
                      </div>
                      <span
                        className={
                          'online-status-offline' + (this.isActiveUser(user.get('username')) ? ' success-text' : '')
                        }
                        data-user-status-id={user.get('_id')}
                      >
                        {this.isActiveUser(user.get('username'))
                          ? 'Now'
                          : this.fromNow(timezone, user.get('lastOnline'))}
                      </span>
                      <div className='user-name'>{user.get('fullname')}</div>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </OffCanvas>
    )
  }
}

OnlineUserListPartial.propTypes = {
  sessionUser: PropTypes.object.isRequired,
  timezone: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
  socket: PropTypes.object.isRequired
}

export default OnlineUserListPartial
