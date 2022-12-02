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
import crypto from 'crypto'
import { TICKETS_COMMENTS_UI_ATTACHMENTS_UPDATE } from 'serverSocket/socketEventConsts'

import helpers from 'lib/helpers'


const setupImages = parent => {
    const imagesEl = parent.issueBody.querySelectorAll('img:not(.hasLinked)')
    imagesEl.forEach(i => helpers.setupImageLink(i))
}

const setupLinks = parent => {
    const linksEl = parent.issueBody.querySelectorAll('a')
    linksEl.forEach(i => helpers.setupLinkWarning(i))
}

@observer
class AttachFilesToComment extends React.Component {
    @observable ticketId = ''
    @observable ticket = ''
    @observable commentId = ''
    @observable status = null
    @observable owner = null
    @observable subject = ''
    @observable issue = ''
    @observable text = ''
    @observable attachments = []
    constructor(props) {
        super(props)
        makeObservable(this)

        this.ticketId = this.props.ticketId
        this.text = this.props.ticketId
        this.ticket = this.props.ticket
        this.status = this.props.status
        this.owner = this.props.owner
        this.subject = this.props.subject
        this.issue = this.props.issue
        this.attachments = this.props.commentAttachedFiles
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
        if (prevProps.attachments !== this.props.commentAttachedFiles) this.attachments = this.props.commentAttachedFiles
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
                this.attachments.length = 0
                this.attachments.push(...comment.attachments)
                console.log('this.attachments')
                console.log(this.attachments)
            }

        }
    }

    onAttachmentInputChange(e) {
        const attachmentFile = e.target.files[0]
        this.attachments.push(attachmentFile)
        this.props.updateData(this.attachments)
    }

    removeAttachment(e, attachment) {
        this.attachments.splice(this.attachments.indexOf(attachment),1)
        this.props.updateData(this.attachments)
    }

    render() {
        return (
            <div className='ticket-comment'>
               <div className='comments-wrapper'>    
                    <a className='comment-email-link' >  
                    </a>
                    {/* Attachments */}
                    <ul className='attachments'>
                        {this.attachments &&
                            this.attachments.map(attachment => (
                                <li key={crypto.randomUUID()}>
                                    <a className='no-ajaxy' rel='noopener noreferrer' target='_blank'>
                                        {attachment.name}
                                    </a>
                                    {this.status !== 3 && (
                                        <a
                                            role='button'
                                            className={'remove-attachment'}
                                            onClick={e => this.removeAttachment(e, attachment)}
                                        >
                                            <i className='fa fa-remove' />
                                        </a>
                                    )}
                                </li>
                            ))}
                    </ul>
                    <div className='issue-body' ref={r => (this.issueBody = r)}>

                    </div>

                    {/* Permissions on Fragment for edit */}
                    {/* {this.status !== 3 && helpers.hasPermOverRole(this.props.owner.role, null, 'tickets:update', true) && ( */}
                    <Fragment>
                        <form className='form nomargin' encType='multipart/form-data'>
                            <div className='add-attachment' onClick={e => this.attachmentInput.click()}>
                                <i className='material-icons' style={{ marginTop: -8, marginRight:-25 }}>&#xE226;</i>
                            </div>

                            <input
                                ref={r => (this.attachmentInput = r)}
                                className='hide'
                                type='file'
                                onChange={e => this.onAttachmentInputChange(e)}
                            />
                        </form>
                    </Fragment>
                    {/* )} */}
                    </div>
                </div>
         
        )
    }
}

AttachFilesToComment.propTypes = {
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

export default AttachFilesToComment
