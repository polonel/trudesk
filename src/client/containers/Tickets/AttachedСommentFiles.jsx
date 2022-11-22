/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/24/19 5:32 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import { fetchTickets, deleteTicket, ticketEvent, unloadTickets, ticketUpdated } from 'actions/tickets'

import Avatar from 'components/Avatar/Avatar'
import ReactHtmlParser from 'react-html-parser'

import { TICKETS_ISSUE_SET, TICKETS_UI_ATTACHMENTS_UPDATE, TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE } from 'serverSocket/socketEventConsts'

import helpers from 'lib/helpers'
import axios from 'axios'
import Log from '../../logger'

const setupImages = parent => {
  const imagesEl = parent.issueBody.querySelectorAll('img:not(.hasLinked)')
  imagesEl.forEach(i => helpers.setupImageLink(i))
}

const setupLinks = parent => {
  const linksEl = parent.issueBody.querySelectorAll('a')
  linksEl.forEach(i => helpers.setupLinkWarning(i))
}

@observer
class AttachedСommentFiles extends React.Component {
  @observable ticketId = ''
  @observable ticket = ''
  @observable commentId = ''
  @observable status = null
  @observable owner = null
  @observable subject = ''
  @observable issue = ''
  @observable attachments = []

  constructor(props) {
    super(props)
    makeObservable(this)

    this.state.attachments = []
    this.ticketId = this.props.ticketId
    this.ticket = this.props.ticket
    this.status = this.props.status
    this.owner = this.props.owner
    this.subject = this.props.subject
    this.issue = this.props.issue
    this.commentId = this.props.commentId
    this.onUpdateCommentAttachments = this.onUpdateCommentAttachments.bind(this)
  }

  componentDidMount() {
    setupImages(this)
    setupLinks(this)


    this.props.socket.on(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, this.onUpdateCommentAttachments)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ticketId !== this.props.ticketId) this.ticketId = this.props.ticketId
    // if (prevProps.commentId !== this.props.commentId) this.commentId = this.props.commentId
    if (prevProps.status !== this.props.status) this.status = this.props.status
    if (prevProps.owner !== this.props.owner) this.owner = this.props.owner
    if (prevProps.subject !== this.props.subject) this.subject = this.props.subject
    if (prevProps.issue !== this.props.issue) this.issue = this.props.issue
  }

  componentWillUnmount() {
    this.props.socket.off(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, this.onUpdateCommentAttachments)
  }

  onUpdateCommentAttachments(data) {
    if (this.ticketId === data.ticket._id) {
      const comment = data.ticket.comments.filter(function (comment) {
        return comment._id == data.commentId;
      })[0];

      if (comment) {
        console.log('comment')
        console.log(comment)
        this.state.attachments.length = 0
        this.state.attachments.push(...comment.attachments)
        console.log(' this.state.attachments')
        console.log( this.state.attachments)
      }

    }
  }

  onAttachmentInputChange(e) {
    const formData = new FormData()
    const attachmentFile = e.target.files[0]
    formData.append('commentId', this.commentId)
    formData.append('ticketId', this.ticketId)
    formData.append('attachment', attachmentFile)
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    axios
      .post(`/tickets/comments/uploadattachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'CSRF-TOKEN': token
        }
      })
      .then(() => {
        this.props.socket.emit(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, { commentId: this.commentId, ticketId: this.ticketId })
        helpers.UI.showSnackbar('Attachment Successfully Uploaded')
      })
      .catch(error => {
        Log.error(error)
        if (error.response) Log.error(error.response)
        helpers.UI.showSnackbar(error, true)
      })
  }

  removeAttachment(e, attachmentId) {
    axios
      .delete(`/api/v1/tickets/${this.ticketId}/comments/${this.commentId}/attachments/remove/${attachmentId}`)
      .then(() => {
        this.props.socket.emit(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, { commentId: this.commentId, ticketId: this.ticketId  })
        helpers.UI.showSnackbar('Attachment Removed')
      })
      .catch(error => {
        Log.error(error)
        if (error.response) Log.error(error.response)
        helpers.UI.showSnackbar(error, true)
      })
  }

  render() {

    const commentId = this.commentId
    const commentTicket = this.props.ticket.comments.filter(function (comment) {
      return comment._id == commentId;
    });
    this.state.attachments = commentTicket[0].attachments
    return (
      <div className='initial-issue uk-clearfix'>
        {/* Issue */}
        <div className='issue-text'>
          {/* Attachments */}
          <ul className='attachments'>
            { this.state.attachments &&
               this.state.attachments.map(attachment => (
                <li key={attachment._id}>
                  <a href={attachment.path} className='no-ajaxy' rel='noopener noreferrer' target='_blank'>
                    {attachment.name}
                  </a>
                  {this.status !== 3 && (
                    <a
                      role='button'
                      className={'remove-attachment'}
                      onClick={e => this.removeAttachment(e, attachment._id)}
                    >
                      <i className='fa fa-remove' />
                    </a>
                  )}
                </li>
              ))}
          </ul>
          <div className='issue-body' ref={r => (this.issueBody = r)}>

          </div>
        </div>
        {/* Permissions on Fragment for edit */}
        {this.status !== 3 && helpers.hasPermOverRole(this.props.owner.role, null, 'tickets:update', true) && (
          <Fragment>
            <div
              className={'edit-issue'}
              onClick={() => {
                if (this.props.editorWindow)
                  this.props.editorWindow.openEditorWindow({
                    subject: this.subject,
                    text: this.issue,
                    onPrimaryClick: data => {
                      this.props.socket.emit(TICKETS_ISSUE_SET, {
                        _id: this.ticketId,
                        value: data.text,
                        subject: data.subjectText
                      })
                    }
                  })
              }}
            >
              <i className='material-icons'>&#xE254;</i>
            </div>
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
          </Fragment>
        )}
      </div>
    )
  }
}

AttachedСommentFiles.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
  owner: PropTypes.object.isRequired,
  subject: PropTypes.string.isRequired,
  issue: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  dateFormat: PropTypes.string.isRequired,
  attachments: PropTypes.array,
  editorWindow: PropTypes.object,
  socket: PropTypes.object.isRequired
}

export default AttachedСommentFiles
