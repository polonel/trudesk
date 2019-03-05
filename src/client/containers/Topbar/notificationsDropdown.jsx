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
 *  Updated:    2/11/19 11:06 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-timezone'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import PDropdown from 'components/PDropdown'

import helpers from 'lib/helpers'
import socket from 'lib/socket'
import 'history'

@observer
class NotificationsDropdownPartial extends React.Component {
  @observable notifications = []

  constructor (props) {
    super(props)

    this.onSocketUpdateNotifications = this.onSocketUpdateNotifications.bind(this)
  }

  componentDidMount () {
    socket.ui.socket.on('updateNotifications', this.onSocketUpdateNotifications)
  }

  componentWillUnmount () {
    socket.ui.socket.off('updateNotifications', this.onSocketUpdateNotifications)
  }

  onSocketUpdateNotifications (data) {
    if (!helpers.arrayIsEqual(this.notifications, data.items)) this.notifications = data.items
  }

  static clearNotificationsClicked (e) {
    e.preventDefault()
    e.stopPropagation()

    socket.ui.clearNotifications()
  }

  static markNotificationRead (e, notification) {
    e.preventDefault()
    e.stopPropagation()

    socket.ui.markNotificationRead(notification._id)

    History.pushState(null, null, `/tickets/${notification.data.ticket.uid}`)
  }

  render () {
    const { shortDateFormat, timezone } = this.props

    return (
      <PDropdown
        id={'notifications'}
        title={'Notifications'}
        topOffset={'-10'}
        leftOffset={'4'}
        rightComponent={
          <a
            className={'hoverUnderline no-ajaxy'}
            onClick={e => NotificationsDropdownPartial.clearNotificationsClicked(e)}
          >
            Clear Notifications
          </a>
        }
        footerComponent={
          <div className={'uk-text-center' + (this.notifications.length < 1 ? ' hide' : '')}>
            <a className={'no-ajaxy hoverUnderline'} onClick={this.props.onViewAllNotificationsClick}>
              View All Notifications
            </a>
          </div>
        }
      >
        {this.notifications.map(notification => {
          const formattedTimestamp = moment
            .utc(notification.created)
            .tz(timezone)
            .format('YYYY-MM-DDThh:mm')
          const formattedDate = moment
            .utc(notification.created)
            .tz(timezone)
            .format(shortDateFormat)
          return (
            <li key={notification._id}>
              <a
                className='item no-ajaxy'
                onClick={e => NotificationsDropdownPartial.markNotificationRead(e, notification)}
              >
                <div className='uk-clearfix'>
                  {notification.unread && <div className={'messageUnread'} />}
                  {notification.type === 0 && (
                    <div className={'messageIcon left'}>
                      <i className='fa fa-check green' />
                    </div>
                  )}
                  {notification.type === 1 && (
                    <div className={'messageIcon left'}>
                      <i className='fa fa-comment-o green' style={{ marginTop: '-5px' }} />
                    </div>
                  )}
                  {notification.type === 2 && (
                    <div className={'messageIcon left'}>
                      <i className='fa fa-exclamation red' />
                    </div>
                  )}
                  <div className='messageAuthor'>
                    <strong>{notification.title}</strong>
                  </div>
                  <div className='messageSnippet'>
                    <span>{notification.message}</span>
                  </div>
                  <div className='messageDate'>
                    <time dateTime={formattedTimestamp} className={'timestamp'}>
                      {formattedDate}
                    </time>
                  </div>
                </div>
              </a>
            </li>
          )
        }, this)}
      </PDropdown>
    )
  }
}

NotificationsDropdownPartial.propTypes = {
  timezone: PropTypes.string.isRequired,
  shortDateFormat: PropTypes.string.isRequired,
  onViewAllNotificationsClick: PropTypes.func.isRequired
}

export default NotificationsDropdownPartial
