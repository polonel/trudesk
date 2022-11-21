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
import axios from 'axios'
import Log from '../../logger'

import helpers from 'lib/helpers'

const setupImages = parent => {
  const imagesEl = parent.body.querySelectorAll('img:not(.hasLinked)')
  imagesEl.forEach(i => helpers.setupImageLink(i))
}

const setupLinks = parent => {
  const linksEl = parent.body.querySelectorAll('a')
  linksEl.forEach(i => helpers.setupLinkWarning(i))
}

class CommentNotePartial extends React.Component {
  componentDidMount () {
    setupImages(this)
    setupLinks(this)
    
    this.props.socket.on(TICKETS_UI_ATTACHMENTS_UPDATE, this.onUpdateTicketAttachments)
  }

  componentDidUpdate () {
    setupImages(this)
    setupLinks(this)
  }

  componentWillUnmount () {}

  onAttachmentInputChange (e) {
    const formData = new FormData()
    const attachmentFile = e.target.files[0]
    formData.append('ticketId', this.ticketId)
    formData.append('attachment', attachmentFile)
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    axios
      .post(`/tickets/uploadattachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'CSRF-TOKEN': token
        }
      })
      .then(() => {
        this.props.socket.emit(TICKETS_UI_ATTACHMENTS_UPDATE, { _id: this.ticketId })
        helpers.UI.showSnackbar('Attachment Successfully Uploaded')
      })
      .catch(error => {
        Log.error(error)
        if (error.response) Log.error(error.response)
        helpers.UI.showSnackbar(error, true)
      })
  }

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
         <form className='form nomargin' encType='multipart/form-data'>
              <div className='add-attachment' onClick={e => this.attachmentInput.click()}>
                <i className='material-icons'>&#xE226;</i>
              </div>

              <input
                ref={r => (this.attachmentInput = r)}
                className='hide'
                type='file'
                onChange={e => this.onAttachmentInputChange(e)}
              />
            </form>
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
  onRemoveClick: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired
}

CommentNotePartial.defaultProps = {
  isNote: false
}

export default CommentNotePartial
