/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/22/19 4:14 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import ReactHtmlParser from 'react-html-parser'
import Avatar from 'components/Avatar/Avatar'

import helpers from 'lib/helpers'
// import socket from 'lib/socket'

const setupImages = parent => {
  const imagesEl = parent.body.querySelectorAll('img:not(.hasLinked)')
  imagesEl.forEach(i => helpers.setupImageLink(i))
}

class CommentNotePartial extends React.Component {
  componentDidMount () {
    setupImages(this)
  }

  componentDidUpdate () {
    setupImages(this)
  }

  componentWillUnmount () {}

  render () {
    const { ticketSubject, comment, isNote, dateFormat, onEditClick, onRemoveClick } = this.props
    const dateFormatted = helpers.formatDate(comment.date, dateFormat)
    return (
      <div className='ticket-comment'>
        <Avatar image={comment.owner.image} userId={comment.owner._id} />
        <div className='issue-text'>
          <h3>Re: {ticketSubject}</h3>
          <a className='comment-email-link' href={`mailto:${comment.owner.email}`}>
            {comment.owner.fullname} &lt;{comment.owner.email}&gt;
          </a>
          <br />
          <time dateTime={dateFormatted} title={dateFormatted} data-uk-tooltip='{delay: 200}'>
            {helpers.calendarDate(comment.date)}
          </time>

          <br />
          {isNote && <span className='uk-badge uk-badge-small nomargin-left-right text-white'>NOTE</span>}

          <div className='comment-body' style={{ marginTop: 10 }} ref={r => (this.body = r)}>
            {isNote && <Fragment>{ReactHtmlParser(comment.note)}</Fragment>}
            {!isNote && <Fragment>{ReactHtmlParser(comment.comment)}</Fragment>}
          </div>
        </div>
        {this.props.ticketStatus !== 3 && (
          <div className='comment-actions'>
            {helpers.hasPermOverRole(comment.owner.role, null, 'comments:delete', true) && (
              <div className='remove-comment' onClick={onRemoveClick}>
                <i className='material-icons'>&#xE5CD;</i>
              </div>
            )}
            {helpers.hasPermOverRole(comment.owner.role, null, 'comments:update', true) && (
              <div className='edit-comment' onClick={onEditClick}>
                <i className='material-icons'>&#xE254;</i>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

CommentNotePartial.propTypes = {
  ticketStatus: PropTypes.number.isRequired,
  ticketSubject: PropTypes.string.isRequired,
  comment: PropTypes.object.isRequired,
  dateFormat: PropTypes.string.isRequired,
  isNote: PropTypes.bool.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired
}

CommentNotePartial.defaultProps = {
  isNote: false
}

export default CommentNotePartial
