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
import { observable } from 'mobx'
import clsx from 'clsx'

import Avatar from 'components/Avatar/Avatar'
import ReactHtmlParser from 'react-html-parser'

import helpers from 'lib/helpers'
import socket from 'lib/socket'
import axios from 'axios'
import Log from '../../logger'

const setupImages = parent => {
  const imagesEl = parent.issueBody.querySelectorAll('img:not(.hasLinked)')
  imagesEl.forEach(i => helpers.setupImageLink(i))
}

@observer
class IssuePartial extends React.Component {
  @observable ticketId = ''
  @observable status = null
  @observable owner = null
  @observable subject = ''
  @observable issue = ''
  @observable attachments = []

  constructor (props) {
    super(props)

    this.ticketId = this.props.ticketId
    this.status = this.props.status
    this.owner = this.props.owner
    this.subject = this.props.subject
    this.issue = this.props.issue
    this.attachments = this.props.attachments

    this.onUpdateTicketIssue = this.onUpdateTicketIssue.bind(this)
    this.onUpdateTicketAttachments = this.onUpdateTicketAttachments.bind(this)
  }

  componentDidMount () {
    setupImages(this)

    socket.socket.on('updateTicketIssue', this.onUpdateTicketIssue)
    socket.socket.on('updateTicketAttachments', this.onUpdateTicketAttachments)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.ticketId !== this.props.ticketId) this.ticketId = this.props.ticketId
    if (prevProps.status !== this.props.status) this.status = this.props.status
    if (prevProps.owner !== this.props.owner) this.owner = this.props.owner
    if (prevProps.subject !== this.props.subject) this.subject = this.props.subject
    if (prevProps.issue !== this.props.issue) this.issue = this.props.issue
    if (prevProps.attachments !== this.props.attachments) this.attachments = this.props.attachments
  }

  componentWillUnmount () {
    socket.socket.off('updateTicketIssue', this.onUpdateTicketIssue)
    socket.socket.off('updateTicketAttachments', this.onUpdateTicketAttachments)
  }

  onUpdateTicketIssue (data) {
    if (this.ticketId === data._id) {
      this.subject = data.subject
      this.issue = data.issue
    }
  }

  onUpdateTicketAttachments (data) {
    if (this.ticketId === data.ticket._id) {
      this.attachments = data.ticket.attachments
    }
  }

  onAttachmentInputChange (e) {
    const formData = new FormData()
    const attachmentFile = e.target.files[0]
    formData.append('ticketId', this.ticketId)
    formData.append('attachment', attachmentFile)
    axios
      .post(`/tickets/uploadattachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(() => {
        socket.ui.refreshTicketAttachments(this.ticketId)
        helpers.UI.showSnackbar('Attachment Successfully Uploaded')
      })
      .catch(error => {
        Log.error(error)
        if (error.response) Log.error(error.response)
        helpers.UI.showSnackbar(error, true)
      })
  }

  removeAttachment (e, attachmentId) {
    axios
      .delete(`/api/v1/tickets/${this.ticketId}/attachments/remove/${attachmentId}`)
      .then(() => {
        socket.ui.refreshTicketAttachments(this.ticketId)
        helpers.UI.showSnackbar('Attachment Removed')
      })
      .catch(error => {
        Log.error(error)
        if (error.response) Log.error(error.response)
        helpers.UI.showSnackbar(error, true)
      })
  }

  render () {
    return (
      <div className='initial-issue uk-clearfix'>
        <Avatar image={this.owner.image} userId={this.owner._id} />
        {/* Issue */}
        <div className='issue-text'>
          <h3 className='subject-text'>{this.subject}</h3>
          <a href={`mailto:${this.owner.email}`}>
            {this.owner.fullname} &lt;{this.owner.email}&gt;
          </a>
          <br />
          <time dateTime={helpers.formatDate(this.props.date, 'YYYY-MM-DD HH:mm')}>
            {helpers.formatDate(this.props.date, this.props.dateFormat)}
          </time>
          <br />
          {/* Attachments */}
          <ul className='attachments'>
            {this.attachments &&
              this.attachments.map(attachment => (
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
            {ReactHtmlParser(this.issue)}
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
                      socket.ui.setTicketIssue(this.ticketId, data.text, data.subjectText)
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

IssuePartial.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
  owner: PropTypes.object.isRequired,
  subject: PropTypes.string.isRequired,
  issue: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  dateFormat: PropTypes.string.isRequired,
  attachments: PropTypes.array,
  editorWindow: PropTypes.object
}

export default IssuePartial
