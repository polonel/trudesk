/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/26/19 3:53 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import helpers from 'lib/helpers'
import socket from 'lib/socket'
import Avatar from 'components/Avatar/Avatar'
import IssuePartial from 'containers/Tickets/IssuePartial'
import TruTabWrapper from 'components/TruTabs/TruTabWrapper'
import TruTabSelectors from 'components/TruTabs/TruTabSelectors'
import TruTabSelector from 'components/TruTabs/TruTabSelector'
import TruTabSection from 'components/TruTabs/TruTabSection'
import CommentNotePartial from 'containers/Tickets/CommentNotePartial'
import EasyMDE from 'components/EasyMDE'

class SingleTicketLoading extends React.Component {
  render () {
    return (
      <Fragment>
        <div className={'page-content'}>
          <div
            className='uk-float-left page-title page-title-small noshadow nopadding relative'
            style={{ width: 360, maxWidth: 360, minWidth: 360 }}
          >
            <div className='page-title-border-right relative' style={{ padding: '0 30px' }}>
              <p>Ticket </p>
            </div>
            {/*  Left Side */}
            <div className='page-content-left full-height scrollable'>
              <div className='ticket-details-wrap uk-position-relative uk-clearfix'>
                <div className='ticket-assignee-wrap uk-clearfix' style={{ paddingRight: 30 }}>
                  <h4>Assignee</h4>
                  <div className='ticket-assignee uk-clearfix'>
                    <Avatar image={undefined} showOnlineBubble={false} />
                    <div className='ticket-assignee-details'>
                      <Fragment>
                        <h3>
                          <div className={'loadingTextAnimation'} />
                        </h3>
                        <div className={'mb-5 loadingTextAnimation'} style={{ width: '65%' }} />
                        <span className={'uk-display-block'}>
                          <div className={'loadingTextAnimation'} />
                        </span>
                      </Fragment>
                    </div>
                  </div>
                </div>

                <div className='uk-width-1-1 padding-left-right-15'>
                  <div className='tru-card ticket-details uk-clearfix'>
                    {/* Type */}
                    <div className='uk-width-1-2 uk-float-left nopadding'>
                      <div className='marginright5'>
                        <span>Type</span>
                        <div className='input-box' style={{ paddingTop: 8 }}>
                          <div className={'loadingTextAnimation'} />
                        </div>
                      </div>
                    </div>
                    {/* Priority */}
                    <div className='uk-width-1-2 uk-float-left nopadding'>
                      <div className='marginleft5'>
                        <span>Priority</span>
                        <div className='input-box'>---</div>
                      </div>
                    </div>
                    {/*  Group */}
                    <div className='uk-width-1-1 nopadding uk-clearfix'>
                      <span>Group</span>
                      <div className='input-box'>---</div>
                    </div>
                    {/*  Due Date */}
                    <div className='uk-width-1-1 p-0'>
                      <span>Due Date</span>
                      <div className='input-box'>---</div>
                    </div>

                    {/* Tags */}
                    <div className='uk-width-1-1 nopadding'>
                      <span>Tags</span>
                      <div className='tag-list uk-clearfix' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right Side */}
        <div className='page-message nopadding' style={{ marginLeft: 360 }}>
          <div className='page-title-right noshadow'>
            <div className='page-top-comments uk-float-right'>
              <a role='button' className='btn no-ajaxy'>
                Add Comment
              </a>
            </div>
            <div
              className='onoffswitch subscribeSwitch uk-float-right'
              style={{ marginRight: 10, position: 'relative', top: 18 }}
            >
              <input id={'subscribeSwitch'} type='checkbox' name='subscribeSwitch' className='onoffswitch-checkbox' />
              <label className='onoffswitch-label' htmlFor='subscribeSwitch'>
                <span className='onoffswitch-inner subscribeSwitch-inner' />
                <span className='onoffswitch-switch subscribeSwitch-switch' />
              </label>
            </div>
            <div className='pagination uk-float-right' style={{ marginRight: 5 }}>
              <ul className='button-group'>
                <li className='pagination'>
                  <a href='#' className='btn no-ajaxy' style={{ borderRadius: 3, marginRight: 5 }}>
                    <i className='material-icons'>&#xE8AD;</i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='page-content-right full-height scrollable'>
            <div className='comments-wrapper'>
              {/*<IssuePartial*/}
              {/*  ticketId={this.ticket._id}*/}
              {/*  status={this.ticket.status}*/}
              {/*  owner={this.ticket.owner}*/}
              {/*  subject={this.ticket.subject}*/}
              {/*  issue={this.ticket.issue}*/}
              {/*  date={this.ticket.date}*/}
              {/*  dateFormat={`${this.props.common.longDateFormat}, ${this.props.common.timeFormat}`}*/}
              {/*  attachments={this.ticket.attachments}*/}
              {/*  editorWindow={this.editorWindow}*/}
              {/*/>*/}
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}

SingleTicketLoading.propTypes = {}

export default SingleTicketLoading
