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

import EasyMDE from 'components/EasyMDE'
import AttachedСommentFilesEdit from 'containers/Tickets/AttachedСommentFilesEdit'
import $ from 'jquery'
import 'jquery_custom'
import helpers from 'lib/helpers'

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

    this.props.AttachingFileToComment(this.attachmentToSave)
    removeAttachments()

    this.closeEditorWindow()
  }

  removeAttachments() {

    for (const attachment of this.attachmentsToRemove) {
      axios
        .delete(`/api/v1/tickets/${this.props.ticket._id}/comments/${this.props.comment?._id}/attachments/remove/${attachment._id}`)
        .then(() => {
          this.props.socket.emit(TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE, { commentId: this.commentId, ticketId: this.ticketId })
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
    console.log( 'this.attachmentsToRemove')
    console.log( this.attachmentsToRemove)
    $(this.editorWindow)
      .removeClass('closed')
      .addClass('open')
  }

  closeEditorWindow(e) {
    if (e) e.preventDefault()

    $(this.editorWindow)
      .removeClass('open')
      .addClass('closed')
  }

  pushAttachmentToRemove = (attachment) => {
    console.log('this.attachmentsToRemove')
    console.log(this.attachmentsToRemove)
    this.attachmentsToRemove.push(attachment)
  }

  pushAttachmentToSave = (attachment) => {
    console.log('this.attachmentsToSave')
    console.log(attachmentsToSave)
    this.attachmentsToSave.push(attachment)
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

                <AttachedСommentFilesEdit
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
                  pushAttachmentToSave={this.pushAttachmentToSave}
                  pushAttachmentToRemove={this.pushAttachmentToRemove}
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
