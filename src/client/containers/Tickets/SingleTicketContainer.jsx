/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/21/19 9:32 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observable, computed, makeObservable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { getSession } from 'app/SessionContext'
import sortBy from 'lodash/sortBy'
import union from 'lodash/union'
import { transferToThirdParty, fetchTicketTypes, fetchTicketStatus } from 'actions/tickets'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { showModal } from 'actions/common'

import {
  TICKETS_UPDATE,
  TICKETS_UI_GROUP_UPDATE,
  TICKETS_GROUP_SET,
  TICKETS_UI_TYPE_UPDATE,
  TICKETS_TYPE_SET,
  TICKETS_UI_PRIORITY_UPDATE,
  TICKETS_PRIORITY_SET,
  TICKETS_ASSIGNEE_LOAD,
  TICKETS_ASSIGNEE_UPDATE,
  TICKETS_UI_DUEDATE_UPDATE,
  TICKETS_DUEDATE_SET,
  TICKETS_UI_TAGS_UPDATE,
  TICKETS_COMMENT_NOTE_REMOVE,
  TICKETS_COMMENT_NOTE_SET
} from 'serverSocket/socketEventConsts'

import AssigneeDropdownPartial from 'containers/Tickets/AssigneeDropdownPartial'
import Avatar from 'components/Avatar/Avatar'
import CommentNotePartial from 'containers/Tickets/CommentNotePartial'
import DatePicker from 'components/DatePicker'
import EasyMDE from 'components/EasyMDE'
import IssuePartial from 'containers/Tickets/IssuePartial'
import OffCanvasEditor from 'components/OffCanvasEditor'
import PDropdownTrigger from 'components/PDropdown/PDropdownTrigger'
import StatusSelector from 'containers/Tickets/StatusSelector'
import TruTabSection from 'components/TruTabs/TruTabSection'
import TruTabSelector from 'components/TruTabs/TruTabSelector'
import TruTabSelectors from 'components/TruTabs/TruTabSelectors'
import TruTabWrapper from 'components/TruTabs/TruTabWrapper'

import axios from 'api/axios'
import libHistory from 'lib/lib-history'
import helpers from 'lib/helpers'
import Log from '../../logger'
import UIkit from 'uikit'
import moment from 'moment'
import SpinLoader from 'components/SpinLoader'
import { Helmet } from 'react-helmet-async'
import TitleContext from 'app/TitleContext'

const fetchTicket = parent => {
  axios
    .get(`/api/v2/tickets/${parent.props.ticketUid}`)
    .then(res => {
      runInAction(() => {
        parent.ticket = res.data.ticket
        parent.isSubscribed =
          parent.ticket &&
          parent.ticket.subscribers.findIndex(i => i._id === parent.props.shared.sessionUser._id) !== -1
      })
    })
    .catch(error => {
      Log.error(error)
      if (error.response?.status === 404) helpers.UI.showSnackbar('404: Ticket not found', true)
      if (error.response?.status === 403 || error.response?.status === 404) {
        libHistory.push('/tickets')
      }
    })
}

const showPriorityConfirm = () => {
  UIkit.modal.confirm(
    'Selected Priority does not exist for this ticket type. Priority has reset to the default for this type.' +
      '<br><br><strong>Please select a new priority</strong>',
    undefined,
    { cancelButtonClass: 'uk-hidden' }
  )
}

@observer
class SingleTicketContainer extends React.Component {
  @observable ticket = null
  @observable isSubscribed = false
  assigneeDropdownPartial = createRef()

  constructor (props) {
    super(props)
    makeObservable(this)

    this.onUpdateTicket = this.onUpdateTicket.bind(this)
    this.onSocketUpdateComments = this.onSocketUpdateComments.bind(this)
    this.onUpdateTicketNotes = this.onUpdateTicketNotes.bind(this)
    this.onUpdateAssignee = this.onUpdateAssignee.bind(this)
    this.onUpdateTicketType = this.onUpdateTicketType.bind(this)
    this.onUpdateTicketPriority = this.onUpdateTicketPriority.bind(this)
    this.onUpdateTicketGroup = this.onUpdateTicketGroup.bind(this)
    this.onUpdateTicketDueDate = this.onUpdateTicketDueDate.bind(this)
    this.onUpdateTicketTags = this.onUpdateTicketTags.bind(this)
  }

  @computed get notesTagged () {
    this.ticket.notes.forEach(i => (i.isNote = true))
    return this.ticket.notes
  }

  @computed get commentsAndNotes () {
    if (!this.ticket) return []
    if (!helpers.canUser('tickets:notes', true)) return sortBy(this.ticket.comments, 'date')
    return sortBy(union(this.ticket.comments, this.notesTagged), 'date')
  }

  @computed get hasCommentsOrNotes () {
    if (!this.ticket) return false
    return this.ticket.comments.length > 0 || this.ticket.notes.length > 0
  }

  componentDidMount () {
    const { socket } = this.props
    socket.on(TICKETS_UPDATE, this.onUpdateTicket)
    socket.on(TICKETS_ASSIGNEE_UPDATE, this.onUpdateAssignee)
    socket.on(TICKETS_UI_TYPE_UPDATE, this.onUpdateTicketType)
    socket.on(TICKETS_UI_PRIORITY_UPDATE, this.onUpdateTicketPriority)
    socket.on(TICKETS_UI_GROUP_UPDATE, this.onUpdateTicketGroup)
    socket.on(TICKETS_UI_DUEDATE_UPDATE, this.onUpdateTicketDueDate)
    socket.on(TICKETS_UI_TAGS_UPDATE, this.onUpdateTicketTags)

    fetchTicket(this)
    this.props.fetchTicketTypes()
    this.props.fetchGroups()
    this.props.fetchTicketStatus()
  }

  componentDidUpdate () {
    helpers.resizeFullHeight()
    helpers.setupScrollers()
  }

  componentWillUnmount () {
    const { socket } = this.props
    socket.off(TICKETS_UPDATE, this.onUpdateTicket)
    socket.off(TICKETS_ASSIGNEE_UPDATE, this.onUpdateAssignee)
    socket.off(TICKETS_UI_TYPE_UPDATE, this.onUpdateTicketType)
    socket.off(TICKETS_UI_PRIORITY_UPDATE, this.onUpdateTicketPriority)
    socket.off(TICKETS_UI_GROUP_UPDATE, this.onUpdateTicketGroup)
    socket.off(TICKETS_UI_DUEDATE_UPDATE, this.onUpdateTicketDueDate)
    socket.off(TICKETS_UI_TAGS_UPDATE, this.onUpdateTicketTags)

    this.props.unloadGroups()
  }

  onUpdateTicket (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket = data })
  }

  onSocketUpdateComments (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.comments = data.comments })
  }

  onUpdateTicketNotes (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.notes = data.notes })
  }

  onUpdateAssignee (data) {
    if (this.ticket._id !== data._id) return
    runInAction(() => {
      this.ticket.assignee = data.assignee
      if (this.ticket.assignee?._id === this.props.shared.sessionUser._id) this.isSubscribed = true
    })
  }

  onUpdateTicketType (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.type = data.type })
  }

  onUpdateTicketPriority (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.priority = data.priority })
  }

  onUpdateTicketGroup (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.group = data.group })
  }

  onUpdateTicketDueDate (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.dueDate = data.dueDate })
  }

  onUpdateTicketTags (data) {
    if (this.ticket._id === data._id) runInAction(() => { this.ticket.tags = data.tags })
  }

  onCommentNoteSubmit (e, type) {
    e.preventDefault()
    const isNote = type === 'note'
    axios
      .post(`/api/v2/tickets/add${isNote ? 'note' : 'comment'}`, {
        _id: !isNote && this.ticket._id,
        comment: !isNote && this.commentMDE.getEditorText(),
        ticketid: isNote && this.ticket._id,
        note: isNote && this.noteMDE.getEditorText()
      })
      .then(res => {
        if (!res?.data?.success) return
        if (isNote) {
          this.ticket.notes = res.data.ticket.notes
          this.noteMDE.setEditorText('')
        } else {
          this.ticket.comments = res.data.ticket.comments
          this.commentMDE.setEditorText('')
        }
        helpers.scrollToBottom('.page-content-right', true)
        this.ticket.history = res.data.ticket.history
      })
      .catch(error => {
        Log.error(error)
        if (error.response) {
          Log.error(error.response)
          helpers.UI.showSnackbar(error.response, true)
        }
      })
  }

  onSubscriberChanged (e) {
    axios
      .put(`/api/v2/tickets/${this.ticket._id}/subscribe`, {
        user: this.props.shared.sessionUser._id,
        subscribe: e.target.checked
      })
      .then(res => {
        if (res.data.success && res.data.ticket) {
          this.ticket.subscribers = res.data.ticket.subscribers
          this.isSubscribed =
            this.ticket.subscribers.findIndex(i => i._id === this.props.shared.sessionUser._id) !== -1
        }
      })
      .catch(error => Log.error(error.response || error))
  }

  transferToThirdParty () {
    this.props.transferToThirdParty({ uid: this.ticket.uid })
  }

  emitEditCommentNote (item) {
    this.editorWindow.openEditorWindow({
      showSubject: false,
      text: !item.isNote ? item.comment : item.note,
      onPrimaryClick: data => {
        this.props.socket.emit(TICKETS_COMMENT_NOTE_SET, {
          _id: this.ticket._id,
          item: item._id,
          isNote: item.isNote,
          value: data.text
        })
      }
    })
  }

  emitRemoveCommentNote (item) {
    this.props.socket.emit(TICKETS_COMMENT_NOTE_REMOVE, {
      _id: this.ticket._id,
      value: item._id,
      isNote: item.isNote
    })
  }

  renderCommentNotePartial (item, statusObj, isNote) {
    const dateFormat = `${this.props.common.get('longDateFormat')}, ${this.props.common.get('timeFormat')}`
    return (
      <CommentNotePartial
        key={item._id}
        ticketStatus={statusObj}
        ticketSubject={this.ticket.subject}
        comment={item}
        isNote={isNote !== undefined ? isNote : item.isNote}
        dateFormat={dateFormat}
        onEditClick={() => this.emitEditCommentNote(item)}
        onRemoveClick={() => this.emitRemoveCommentNote(item)}
      />
    )
  }

  renderLeftPanel (mappedTypes, mappedGroups, hasTicketUpdate) {
    const { socket, common } = this.props
    const { ticket } = this

    return (
      <div
        className='uk-float-left page-title page-title-small noshadow nopadding relative'
        style={{ width: 360, maxWidth: 360, minWidth: 360 }}
      >
        <div className='page-title-border-right relative' style={{ padding: '0 30px' }}>
          <p>Ticket #{ticket.uid}</p>
          <StatusSelector
            ticketId={ticket._id}
            status={typeof ticket.status === 'object' ? ticket.status._id : ticket.status}
            socket={socket}
            onStatusChange={status => runInAction(() => { this.ticket.status = status })}
            hasPerm={this.hasTicketStatusUpdate()}
          />
        </div>

        <div className='page-content-left full-height scrollable'>
          <div className='ticket-details-wrap uk-position-relative uk-clearfix'>
            {/* Assignee */}
            <div className='ticket-assignee-wrap uk-clearfix' style={{ paddingRight: 30 }}>
              <h4>Assignee</h4>
              <div className='ticket-assignee uk-clearfix'>
                {hasTicketUpdate ? (
                  <a
                    role='button'
                    title='Set Assignee'
                    style={{ float: 'left' }}
                    className='relative no-ajaxy'
                    onClick={() => socket.emit(TICKETS_ASSIGNEE_LOAD)}
                  >
                    <PDropdownTrigger target={this.assigneeDropdownPartial}>
                      <Avatar
                        image={ticket.assignee?.image}
                        showOnlineBubble={ticket.assignee !== undefined}
                        userId={ticket.assignee?._id}
                      />
                      <span className='drop-icon material-icons'>keyboard_arrow_down</span>
                    </PDropdownTrigger>
                  </a>
                ) : (
                  <Avatar
                    image={ticket.assignee?.image}
                    showOnlineBubble={ticket.assignee !== undefined}
                    userId={ticket.assignee?._id}
                  />
                )}
                <div className='ticket-assignee-details'>
                  {ticket.assignee ? (
                    <>
                      <h3>{ticket.assignee.fullname}</h3>
                      <a
                        className='comment-email-link uk-text-truncate uk-display-inline-block'
                        href={`mailto:${ticket.assignee.email}`}
                      >
                        {ticket.assignee.email}
                      </a>
                      <span className='uk-display-block'>{ticket.assignee.title}</span>
                    </>
                  ) : (
                    <h3>No User Assigned</h3>
                  )}
                </div>
              </div>

              {hasTicketUpdate && (
                <AssigneeDropdownPartial
                  forwardedRef={this.assigneeDropdownPartial}
                  ticketId={ticket._id}
                  onClearClick={() => runInAction(() => { this.ticket.assignee = undefined })}
                  onAssigneeClick={({ agent }) => runInAction(() => { this.ticket.assignee = agent })}
                />
              )}
            </div>

            {/* Type / Priority / Group / Due Date / Tags */}
            <div className='uk-width-1-1 padding-left-right-15'>
              <div className='tru-card ticket-details uk-clearfix'>
                <div className='uk-width-1-2 uk-float-left nopadding'>
                  <div className='marginright5'>
                    <span>Type</span>
                    {hasTicketUpdate ? (
                      <select
                        value={ticket.type._id}
                        onChange={e => {
                          const type = this.props.ticketTypes.find(t => t.get('_id') === e.target.value)
                          const hasPriority =
                            type.get('priorities').findIndex(p => p.get('_id') === ticket.priority._id) !== -1
                          if (!hasPriority) {
                            socket.emit(TICKETS_PRIORITY_SET, {
                              _id: ticket._id,
                              value: type.get('priorities').find(() => true)
                            })
                            showPriorityConfirm()
                          }
                          socket.emit(TICKETS_TYPE_SET, { _id: ticket._id, value: e.target.value })
                        }}
                      >
                        {mappedTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.text}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className='input-box'>{ticket.type.name}</div>
                    )}
                  </div>
                </div>

                <div className='uk-width-1-2 uk-float-left nopadding'>
                  <div className='marginleft5'>
                    <span>Priority</span>
                    {hasTicketUpdate ? (
                      <select
                        name='tPriority'
                        id='tPriority'
                        value={ticket.priority._id}
                        onChange={e =>
                          socket.emit(TICKETS_PRIORITY_SET, { _id: ticket._id, value: e.target.value })
                        }
                      >
                        {ticket.type?.priorities?.map(priority => (
                          <option key={priority._id} value={priority._id}>
                            {priority.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className='input-box'>{ticket.priority.name}</div>
                    )}
                  </div>
                </div>

                <div className='uk-width-1-1 nopadding uk-clearfix'>
                  <span>Group</span>
                  {hasTicketUpdate ? (
                    <select
                      value={ticket.group._id}
                      onChange={e => socket.emit(TICKETS_GROUP_SET, { _id: ticket._id, value: e.target.value })}
                    >
                      {mappedGroups.map(group => (
                        <option key={group.value} value={group.value}>
                          {group.text}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className='input-box'>{ticket.group.name}</div>
                  )}
                </div>

                <div className='uk-width-1-1 p-0'>
                  <span>Due Date</span> {hasTicketUpdate && <span>-&nbsp;</span>}
                  {hasTicketUpdate ? (
                    <div className='uk-display-inline'>
                      <a
                        role='button'
                        onClick={e => {
                          e.preventDefault()
                          socket.emit(TICKETS_DUEDATE_SET, { _id: ticket._id, value: undefined })
                        }}
                      >
                        Clear
                      </a>
                      <DatePicker
                        name='ticket_due_date'
                        format={helpers.getShortDateFormat()}
                        value={ticket.dueDate}
                        small={true}
                        onChange={e => {
                          const dueDate = moment(e.target.value, helpers.getShortDateFormat()).utc().toISOString()
                          socket.emit(TICKETS_DUEDATE_SET, { _id: ticket._id, value: dueDate })
                        }}
                      />
                    </div>
                  ) : (
                    <div className='input-box'>
                      {helpers.formatDate(ticket.dueDate, common.get('shortDateFormat'))}
                    </div>
                  )}
                </div>

                <div className='uk-width-1-1 nopadding'>
                  <span>
                    Tags
                    {hasTicketUpdate && (
                      <>
                        <span> - </span>
                        <div id='editTags' className='uk-display-inline'>
                          <a
                            role='button'
                            style={{ fontSize: 11 }}
                            className='no-ajaxy'
                            onClick={() =>
                              this.props.showModal('ADD_TAGS_MODAL', {
                                ticketId: ticket._id,
                                currentTags: ticket.tags.map(tag => tag._id)
                              })
                            }
                          >
                            Edit Tags
                          </a>
                        </div>
                      </>
                    )}
                  </span>
                  <div className='tag-list uk-clearfix'>
                    {ticket.tags?.map(tag => (
                      <div key={tag._id} className='item'>
                        {tag.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {helpers.canUser('agent:*', true) && (
              <div className='uk-width-1-1 padding-left-right-15'>
                <div className='tru-card ticket-details pr-0 pb-0' style={{ height: 250 }}>
                  Ticket History
                  <hr style={{ padding: 0, margin: 0 }} />
                  <div className='history-items scrollable' style={{ paddingTop: 12 }}>
                    {ticket.history?.map(item => (
                      <div key={item._id} className='history-item'>
                        <time dateTime={helpers.formatDate(item.date, common.get('longDateFormat'))} />
                        <em>
                          Action by: <span>{item.owner.fullname}</span>
                        </em>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  renderCommentsTabs (statusObj) {
    const dateFormat = `${this.props.common.get('longDateFormat')}, ${this.props.common.get('timeFormat')}`
    const { ticket } = this

    return (
      <TruTabWrapper>
        <TruTabSelectors style={{ marginLeft: 110 }}>
          <TruTabSelector selectorId={0} label='All' active={true} showBadge={true} badgeText={this.commentsAndNotes.length} />
          <TruTabSelector
            selectorId={1}
            label='Comments'
            showBadge={true}
            badgeText={ticket.comments?.length ?? 0}
          />
          {helpers.canUser('tickets:notes', true) && (
            <TruTabSelector selectorId={2} label='Notes' showBadge={true} badgeText={ticket.notes?.length ?? 0} />
          )}
        </TruTabSelectors>

        <TruTabSection sectionId={0} active={true}>
          <div className='all-comments'>
            {this.commentsAndNotes.map(item => this.renderCommentNotePartial(item, statusObj, item.isNote ?? false))}
          </div>
        </TruTabSection>

        <TruTabSection sectionId={1}>
          <div className='comments'>
            {ticket.comments?.map(comment => (
              <CommentNotePartial
                key={comment._id}
                ticketStatus={statusObj}
                ticketSubject={ticket.subject}
                comment={comment}
                isNote={false}
                dateFormat={dateFormat}
                onEditClick={() => this.emitEditCommentNote(comment)}
                onRemoveClick={() => this.emitRemoveCommentNote(comment)}
              />
            ))}
          </div>
        </TruTabSection>

        <TruTabSection sectionId={2}>
          <div className='notes'>
            {ticket.notes?.map(note => (
              <CommentNotePartial
                key={note._id}
                ticketStatus={statusObj}
                ticketSubject={ticket.subject}
                comment={note}
                isNote={true}
                dateFormat={dateFormat}
                onEditClick={() => this.emitEditCommentNote(note)}
                onRemoveClick={() => this.emitRemoveCommentNote(note)}
              />
            ))}
          </div>
        </TruTabSection>
      </TruTabWrapper>
    )
  }

  renderReplyForm () {
    const { ticket } = this
    const canComment = helpers.canUser('comments:create', true)
    const canNote = helpers.canUser('tickets:notes', true)

    if (ticket.status.isResolved !== false || (!canComment && !canNote)) return null

    return (
      <div className='uk-width-1-1 ticket-reply uk-clearfix'>
        <Avatar image={this.props.shared.sessionUser.image} showOnlineBubble={false} />
        <TruTabWrapper style={{ paddingLeft: 85 }}>
          <TruTabSelectors showTrack={false}>
            {canComment && <TruTabSelector selectorId={0} label='Comment' active={true} />}
            {canNote && (
              <TruTabSelector selectorId={1} label='Internal Note' active={!canComment} />
            )}
          </TruTabSelectors>

          <TruTabSection sectionId={0} style={{ paddingTop: 0 }} active={canComment}>
            <form onSubmit={e => this.onCommentNoteSubmit(e, 'comment')}>
              <EasyMDE
                allowImageUpload={true}
                inlineImageUploadUrl={`/api/v2/tickets/${ticket.uid}/upload/inline`}
                inlineImageUploadHeaders={{
                  ticketid: ticket._id,
                  Authorization: `Bearer ${getSession()?.token}`
                }}
                ref={r => (this.commentMDE = r)}
              />
              <div className='uk-width-1-1 uk-clearfix' style={{ marginTop: 50 }}>
                <div className='uk-float-right'>
                  <button type='submit' className='uk-button uk-button-accent' style={{ padding: '10px 15px' }}>
                    Post Comment
                  </button>
                </div>
              </div>
            </form>
          </TruTabSection>

          <TruTabSection sectionId={1} style={{ paddingTop: 0 }} active={!canComment && canNote}>
            <form onSubmit={e => this.onCommentNoteSubmit(e, 'note')}>
              <EasyMDE
                allowImageUpload={true}
                inlineImageUploadUrl='/tickets/uploadmdeimage'
                inlineImageUploadHeaders={{ ticketid: ticket._id }}
                ref={r => (this.noteMDE = r)}
              />
              <div className='uk-width-1-1 uk-clearfix' style={{ marginTop: 50 }}>
                <div className='uk-float-right'>
                  <button type='submit' className='uk-button uk-button-accent' style={{ padding: '10px 15px' }}>
                    Save Note
                  </button>
                </div>
              </div>
            </form>
          </TruTabSection>
        </TruTabWrapper>
      </div>
    )
  }

  hasTicketStatusUpdate () {
    const { sessionUser } = this.props
    const isAgent = sessionUser?.role.isAgent ?? false
    const isAdmin = sessionUser?.role.isAdmin ?? false
    if (isAgent || isAdmin) return helpers.canUser('tickets:update')
    if (!this.ticket || !sessionUser) return false
    return helpers.hasPermOverRole(this.ticket.owner.role, sessionUser.role, 'tickets:update', false)
  }

  render () {
    const { ticket } = this
    const { common, groupsState, ticketTypes, socket } = this.props

    const mappedGroups = groupsState?.groups.map(g => ({ text: g.get('name'), value: g.get('_id') })) ?? []
    const mappedTypes = ticketTypes?.map(t => ({ text: t.get('name'), value: t.get('_id'), raw: t.toJS() })) ?? []

    const hasTicketUpdate = ticket && ticket.status !== 3 && helpers.canUser('tickets:update')
    const ticketStatusId = ticket ? (typeof ticket.status === 'object' ? ticket.status._id : ticket.status) : null
    const statusObj = ticketStatusId ? this.props.ticketStatuses.find(s => s.get('_id') === ticketStatusId) : null

    return (
      <div className='uk-clearfix uk-position-relative' style={{ width: '100%', height: '100vh' }}>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{`${title} Ticket ${ticket ? ticket.uid : ''}`}</title>
            </Helmet>
          )}
        </TitleContext.Consumer>

        {!ticket && <SpinLoader active={true} />}
        {ticket && (
          <>
            <div className='page-content'>
              {this.renderLeftPanel(mappedTypes, mappedGroups, hasTicketUpdate)}

              {/* Right Side */}
              <div className='page-message nopadding' style={{ marginLeft: 360 }}>
                <div className='page-title-right noshadow'>
                  {common.get('hasThirdParty') && (
                    <div className='page-top-comments uk-float-right'>
                      <a
                        role='button'
                        className='btn md-btn-primary no-ajaxy'
                        onClick={e => {
                          e.preventDefault()
                          this.transferToThirdParty()
                        }}
                      >
                        Transfer to ThirdParty
                      </a>
                    </div>
                  )}
                  <div className='page-top-comments uk-float-right'>
                    <a
                      role='button'
                      className='btn no-ajaxy'
                      onClick={e => {
                        e.preventDefault()
                        helpers.scrollToBottom('.page-content-right', true)
                      }}
                    >
                      Add Comment
                    </a>
                  </div>
                  <div
                    className='onoffswitch subscribeSwitch uk-float-right'
                    style={{ marginRight: 10, position: 'relative', top: 18 }}
                  >
                    <input
                      id='subscribeSwitch'
                      type='checkbox'
                      name='subscribeSwitch'
                      className='onoffswitch-checkbox'
                      checked={this.isSubscribed}
                      onChange={e => this.onSubscriberChanged(e)}
                    />
                    <label className='onoffswitch-label' htmlFor='subscribeSwitch'>
                      <span className='onoffswitch-inner subscribeSwitch-inner' />
                      <span className='onoffswitch-switch subscribeSwitch-switch' />
                    </label>
                  </div>
                  <div className='pagination uk-float-right' style={{ marginRight: 5 }}>
                    <ul className='button-group'>
                      {helpers.canUser('tickets:print') && (
                        <li className='pagination'>
                          <a
                            href={`/tickets/print/${ticket.uid}`}
                            className='btn no-ajaxy'
                            style={{ borderRadius: 3, marginRight: 5 }}
                            rel='noopener noreferrer'
                            target='_blank'
                          >
                            <i className='material-icons'>&#xE8AD;</i>
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className='page-content-right full-height scrollable'>
                  <div className='comments-wrapper'>
                    {statusObj && (
                      <IssuePartial
                        ticketId={ticket._id}
                        status={statusObj}
                        owner={ticket.owner}
                        subject={ticket.subject}
                        issue={ticket.issue}
                        date={ticket.date}
                        dateFormat={`${common.get('longDateFormat')}, ${common.get('timeFormat')}`}
                        attachments={ticket.attachments}
                        editorWindow={this.editorWindow}
                        socket={socket}
                      />
                    )}

                    {this.hasCommentsOrNotes && statusObj && this.renderCommentsTabs(statusObj)}

                    {this.renderReplyForm()}
                  </div>
                </div>
              </div>
            </div>
            <OffCanvasEditor primaryLabel='Save Edit' ref={r => (this.editorWindow = r)} />
          </>
        )}
      </div>
    )
  }
}

SingleTicketContainer.propTypes = {
  ticketId: PropTypes.string,
  ticketUid: PropTypes.string.isRequired,
  shared: PropTypes.object.isRequired,
  sessionUser: PropTypes.object,
  socket: PropTypes.object.isRequired,
  common: PropTypes.object.isRequired,
  ticketTypes: PropTypes.object.isRequired,
  fetchTicketTypes: PropTypes.func.isRequired,
  fetchTicketStatus: PropTypes.func.isRequired,
  ticketStatuses: PropTypes.object.isRequired,
  groupsState: PropTypes.object.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  transferToThirdParty: PropTypes.func
}

const mapStateToProps = state => ({
  common: state.common.viewdata,
  shared: state.shared,
  sessionUser: state.shared.sessionUser,
  socket: state.shared.socket,
  ticketTypes: state.ticketsState.types,
  ticketStatuses: state.ticketsState.ticketStatuses,
  groupsState: state.groupsState
})

export default connect(mapStateToProps, {
  fetchTicketTypes,
  fetchGroups,
  fetchTicketStatus,
  unloadGroups,
  showModal,
  transferToThirdParty
})(SingleTicketContainer)
