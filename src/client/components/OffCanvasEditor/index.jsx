/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/22/19 8:43 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { makeObservable, observable } from 'mobx'
import { observer } from 'mobx-react'
import axios from 'axios'

import EasyMDE from 'components/EasyMDE'
import AttachedCommentFilesEdit from 'containers/Tickets/AttachedCommentFilesEdit'
import $ from 'jquery'
import 'jquery_custom'
import helpers from 'lib/helpers'
import Log from '../../logger'
import { TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE } from 'serverSocket/socketEventConsts'

@observer
class OffCanvasEditor extends React.Component {
  @observable mdeText = ''
  @observable subjectText = ''
  @observable showSubject = true
  @observable onPrimaryClick = null
  @observable comment
  @observable attachmentsToRemove = []
  @observable attachmentsToSave = []
  constructor(props) {
    super(props)
    makeObservable(this)

    this.primaryClick = this.primaryClick.bind(this)
  }

  componentDidMount() {
    helpers.UI.inputs()
    $('.off-canvas-bottom').DivResizer({})
    this.showSubject = this.props.showSubject
  }

  componentDidUpdate() {
    helpers.UI.reRenderInputs()
  }

  primaryClick() {
    const data = {
      subjectText: this.subjectText,
      text: this.mdeText
    }

    if (this.onPrimaryClick) this.onPrimaryClick(data)
    console.log('this.attachmentsToSave')
    console.log(this.attachmentsToSave)
    console.log('this.attachmentsToRemove')
    console.log(this.attachmentsToRemove)
    this.removeAttachments()
    
    if (this.attachmentsToSave.length !== 0) {
      this.props.updateData(this.attachmentsToSave)
    }
    this.props.attachingFileToComment(this.comment._id)
    this.closeEditorWindow()
    this.attachmentsToSave = []
    this.attachmentsToRemove = []
  }

  async removeAttachments() {
    for (const attachment of this.attachmentsToRemove) {

      await axios
        .delete(`/api/v1/tickets/${this.props.ticket._id}/comments/${this.comment?._id}/attachments/remove/${attachment._id}`)
        .then(() => {
          this.props.socket.emit(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, { commentId: this.comment?._id, ticketId: this.props.ticket._id })
          helpers.UI.showSnackbar('Attachment Removed')
        })
        .catch(error => {
          Log.error(error)
          if (error.response) Log.error(error.response)
          helpers.UI.showSnackbar(error, true)
        })

    }

  }

  openEditorWindow(data) {
    this.subjectText = data.subject || ''
    this.mdeText = data.text || ''
    this.editor.setEditorText(this.mdeText)
    this.showSubject = data.showSubject !== undefined ? data.showSubject : true
    this.comment = data.comment
    this.onPrimaryClick = data.onPrimaryClick || null
    $(this.editorWindow)
      .removeClass('closed')
      .addClass('open')
  }

  closeEditorWindow(e) {
    if (e) e.preventDefault()
    this.props.socket.emit(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, { commentId: this.comment?._id, ticketId: this.props.ticket._id })
    $(this.editorWindow)
      .removeClass('open')
      .addClass('closed')
  }

  pushAttachmentToRemove = (attachment) => {
    this.attachmentsToRemove.push(attachment)
    if (this.attachmentsToSave.length !== 0) {
      if (this.attachmentsToSave.indexOf(attachment) !== -1) {
        this.attachmentsToSave.splice(this.attachmentsToSave.indexOf(attachment), 1)
      }
    }
  }

  pushAttachmentToSave = (attachment) => {
    this.attachmentsToSave.push(attachment)
    if (this.attachmentsToRemove.length !== 0) {
      if (this.attachmentsToRemove.indexOf(attachment) !== -1) {
        this.attachmentsToRemove.splice(this.attachmentsToRemove.indexOf(attachment), 1)
      }
    }
  }

  render() {
    return (
      <div className='off-canvas-bottom closed' ref={r => (this.editorWindow = r)}>
        <div className='edit-window-wrapper'>
          {this.showSubject && (
            <div className='edit-subject-wrap'>
              <label htmlFor='edit-subject-input'>Subject</label>
              <input
                id='edit-subject-input'
                className='md-input mb-10'
                value={this.subjectText}
                onChange={e => (this.subjectText = e.target.value)}
              />
            </div>
          )}
          <div className='editor-container'>
            <div className='editor'>
              <div className='code-mirror-wrap'>
                <EasyMDE
                  showStatusBar={false}
                  defaultValue={this.mdeText}
                  value={this.mdeText}
                  onChange={val => (this.mdeText = val)}
                  ref={r => (this.editor = r)}
                  allowImageUpload={this.props.allowUploads}
                  inlineImageUploadUrl={this.props.uploadURL}
                />

                <AttachedCommentFilesEdit
                  ticket={this.props.ticket}
                  commentId={this.comment?._id}
                  comment={this.comment}
                  attachments={this.comment?.attachments}
                  status={this.props.status}
                  owner={this.props.owner}
                  subject={this.props.subject}
                  issue={this.props.issue}
                  date={this.props.date}
                  dateFormat={this.props.dateFormat}
                  editorWindow={this.props.editorWindow}
                  socket={this.props.socket}
                  pushAttachmentToRemove={this.pushAttachmentToRemove}
                  pushAttachmentToSave={this.pushAttachmentToSave}
                />
              </div>
            </div>
          </div>

          <div className='action-panel'>
            <div className='left-buttons'>
              <button className='save-btn uk-button uk-button-accent mr-5' onClick={this.primaryClick}>
                {this.props.primaryLabel}
              </button>
              <button className='uk-button uk-button-cancel' onClick={e => this.closeEditorWindow(e)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

OffCanvasEditor.propTypes = {
  showSubject: PropTypes.bool,
  primaryLabel: PropTypes.string.isRequired,
  onPrimaryClick: PropTypes.func,
  closeLabel: PropTypes.string,
  allowUploads: PropTypes.bool,
  uploadURL: PropTypes.string
}

OffCanvasEditor.defaultProps = {
  showSubject: true,
  closeLabel: 'Cancel',
  allowUploads: false
}

export default OffCanvasEditor
