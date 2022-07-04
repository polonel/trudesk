import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import clsx from 'clsx'
import Log from '../../logger'

import {
  fetchConversations,
  fetchSingleConversation,
  unloadSingleConversation,
  unloadConversations,
  sendMessage,
  receiveMessage
} from 'actions/messages'
import {
  MESSAGES_USER_TYPING,
  MESSAGES_UI_USER_TYPING,
  MESSAGES_SEND,
  MESSAGES_UI_RECEIVE
} from 'serverSocket/socketEventConsts'

import SpinLoader from 'components/SpinLoader'
import PageTitle from 'components/PageTitle'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'

import UIKit from 'uikit'
import $ from 'jquery'
import helpers from 'lib/helpers'
import Avatar from 'components/Avatar/Avatar'

@observer
class MessagesContainer extends React.Component {
  @observable userListShown = false
  @observable singleConversationLoaded = false
  @observable typingTimers = {}

  conversationScrollSpy = createRef()
  userTypingBubbles = createRef()
  messagesContainer = createRef()

  constructor (props) {
    super(props)

    makeObservable(this)

    this.onReceiveMessage = this.onReceiveMessage.bind(this)
    this.onUserIsTyping = this.onUserIsTyping.bind(this)
    this.onUserStopTyping = this.onUserStopTyping.bind(this)
    this._stopTyping = this._stopTyping.bind(this)
  }

  componentDidMount () {
    this.props.fetchConversations()

    this.props.socket.on(MESSAGES_UI_USER_TYPING, this.onUserIsTyping)
    this.props.socket.on(MESSAGES_UI_RECEIVE, this.onReceiveMessage)

    helpers.resizeFullHeight()

    if (this.props.initialConversation) {
      this.props.fetchSingleConversation({ _id: this.props.initialConversation }).then(() => {
        this.scrollToMessagesBottom(true)
      })
    }
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    helpers.resizeAll()
    helpers.setupScrollers()
    this.setupContextMenu()
  }

  componentWillUnmount () {
    this.props.unloadConversations()
    this.props.unloadSingleConversation()

    this.props.socket.off(MESSAGES_UI_USER_TYPING, this.onUserIsTyping)
    this.props.socket.off(MESSAGES_UI_RECEIVE, this.onReceiveMessage)
  }

  onReceiveMessage (data) {
    data.isOwner = data.message.owner._id.toString() === this.props.sessionUser._id.toString()
    this.props.receiveMessage(data)

    // Hide Bubbles
    const currentConversation = this.props.messagesState.currentConversation
    if (
      !data.isOwner &&
      currentConversation &&
      currentConversation.get('_id').toString() === data.message.conversation.toString()
    ) {
      if (this.userTypingBubbles.current && !this.userTypingBubbles.current.classList.contains('hide'))
        this.userTypingBubbles.current.classList.add('hide')
    }
  }

  onUserIsTyping (data) {
    const typingTimerKey = `${data.cid}_${data.from}`
    if (this.typingTimers[typingTimerKey]) {
      clearTimeout(this.typingTimers[typingTimerKey])
    }

    this.typingTimers[typingTimerKey] = setTimeout(this._stopTyping, 10000, data.cid, data.from)

    // Show Bubbles
    if (this.props.messagesState.currentConversation) {
      if (this.props.messagesState.currentConversation.get('_id').toString() === data.cid.toString()) {
        this.scrollToMessagesBottom(false)
        if (this.userTypingBubbles.current && this.userTypingBubbles.current.classList.contains('hide'))
          this.userTypingBubbles.current.classList.remove('hide')
      }
    }
  }

  _stopTyping (cid, from) {
    const typingTimerKey = `${cid}_${from}`
    this.typingTimers[typingTimerKey] = undefined

    // Hide Bubbles
    if (this.props.messagesState.currentConversation) {
      if (this.props.messagesState.currentConversation.get('_id').toString() === cid.toString()) {
        if (this.userTypingBubbles.current && !this.userTypingBubbles.current.classList.contains('hide'))
          this.userTypingBubbles.current.classList.add('hide')
      }
    }
  }

  onUserStopTyping (data) {
    console.log(data)
  }

  showUserList (e) {
    e.preventDefault()
    this.userListShown = true
  }

  hideUserList (e) {
    e.preventDefault()
    this.userListShown = false
  }

  setupContextMenu () {
    // Setup Context Menu
    helpers.setupContextMenu('#conversationList > ul > li', function (action, target) {
      let $li = $(target)
      if (!$li.is('li')) {
        $li = $(target).parents('li')
      }
      const convoId = $li.attr('data-conversation-id')
      if (action.toLowerCase() === 'delete') {
        UIKit.modal.confirm(
          'Are you sure you want to delete this conversation?',
          function () {
            // Confirm
            console.log(convoId)
            // deleteConversation(convoId)
          },
          function () {
            // Cancel
          },
          {
            labels: {
              Ok: 'YES'
            },
            confirmButtonClass: 'md-btn-danger'
          }
        )
      }
    })
  }

  scrollToMessagesBottom (hideLoader) {
    setTimeout(() => {
      if (this.messagesContainer.current) helpers.scrollToBottom($(this.messagesContainer.current), false)
      if (hideLoader) this.singleConversationLoaded = true
    }, 100)
  }

  onConversationClicked (id) {
    if (
      this.props.messagesState.currentConversation &&
      this.props.messagesState.currentConversation.get('_id').toString() === id.toString()
    )
      return

    // History.replaceState(null, null, `/messages/${id}`)

    this.props.unloadSingleConversation().then(() => {
      this.singleConversationLoaded = false
      this.props.fetchSingleConversation({ _id: id }).then(() => {
        this.scrollToMessagesBottom(true)
      })
    })
  }

  onSendMessageKeyDown (e, cid, to) {
    if (e.code !== 'Enter' || e.code !== 'NumpadEnter') {
      this.props.socket.emit(MESSAGES_USER_TYPING, { cid, to, from: this.props.sessionUser._id })
    }
  }

  onSendMessageSubmit (e, cId, to) {
    e.preventDefault()
    if (!cId || !to) return

    if (e.target.chatMessage && e.target.chatMessage.value !== '') {
      this.props
        .sendMessage({
          cId,
          owner: this.props.sessionUser._id,
          body: e.target.chatMessage.value.trim()
        })
        .then(res => {
          this.props.socket.emit(MESSAGES_SEND, {
            to,
            from: this.props.sessionUser._id,
            message: res.message
          })

          $(e.target.chatMessage).val('')

          this.scrollToMessagesBottom()
        })
    }
  }

  render () {
    const { currentConversation } = this.props.messagesState

    return (
      <div>
        <Grid>
          <GridItem width={'3-10'} extraClass={'full-height'}>
            <PageTitle
              title={'Conversations'}
              extraClasses={'page-title-border-right'}
              hideBorderBottom={true}
              rightComponent={
                <div className={'uk-position-relative'}>
                  <div id='convo-actions' style={{ position: 'absolute', top: 20, right: 15 }}>
                    {!this.userListShown && (
                      <a
                        title='Start Conversation'
                        className='no-ajaxy'
                        style={{ display: 'block', height: 28 }}
                        onClick={e => this.showUserList(e)}
                      >
                        <i className='material-icons' style={{ fontSize: '28px', fontWeight: 300 }}>
                          add
                        </i>
                      </a>
                    )}
                    {this.userListShown && (
                      <a
                        className='no-ajaxy'
                        style={{ height: 28, lineHeight: '30px', fontSize: '16px', fontWeight: 300 }}
                        onClick={e => this.hideUserList(e)}
                      >
                        Cancel
                      </a>
                    )}
                  </div>
                </div>
              }
            />

            <div id={'conversationList'} className='page-content-left noborder full-height'>
              <ul className='message-items scrollable'>
                {this.props.messagesState.conversations.map(convo => {
                  const partnerId = convo.get('partner').get('_id')
                  const partnerImage = convo.get('partner').get('image') || 'defaultProfile.jpg'
                  const updatedDate = helpers.getCalendarDate(convo.get('updatedAt'))
                  const isCurrentConversation = !!(
                    this.props.messagesState.currentConversation &&
                    this.props.messagesState.currentConversation.toJS()._id.toString() === convo.toJS()._id.toString()
                  )

                  return (
                    <li
                      key={convo.get('_id')}
                      className={clsx(isCurrentConversation && 'active')}
                      data-conversation-id={convo.get('_id')} // Used for ContextMenu
                      onClick={() => this.onConversationClicked(convo.get('_id'))}
                    >
                      <Avatar userId={partnerId} image={partnerImage} />
                      <div className='convo-info'>
                        <span className='message-from'>{convo.get('partner').get('fullname')}</span>
                        <span className='message-date'>{updatedDate}</span>
                        <span className='message-subject'>{convo.get('recentMessage')}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </GridItem>
          {currentConversation && (
            <GridItem width={'7-10'} extraClass={'nopadding page-message uk-position-relative'}>
              <SpinLoader active={!this.singleConversationLoaded} animate={true} animateDelay={300} />
              <div
                ref={this.messagesContainer}
                className='page-content page-content-right full-height scrollable'
                data-offset={41}
                style={{ marginBottom: '41px !important' }}
              >
                <span className={'conversation-start'}>
                  Conversation Started on {currentConversation.get('createdAt')}
                </span>
                {currentConversation.get('requestingUserMeta').get('deletedAt') && (
                  <span className={'conversation-deleted'}>
                    Conversation Deleted at {currentConversation.get('requestingUserMeta').get('deletedAt')}
                  </span>
                )}
                <div ref={this.conversationScrollSpy} className={clsx('uk-text-center', 'uk-hidden')}>
                  <i className='uk-icon-refresh uk-icon-spin' />
                </div>
                <div id={'messages'}>
                  {currentConversation.get('messages').map(message => {
                    const ownerImage = message.get('owner').get('image') || 'defaultProfile.jpg'
                    const isMessageOwner =
                      message
                        .get('owner')
                        .get('_id')
                        .toString() === this.props.sessionUser._id
                    const formattedDate = helpers.formatDate(
                      message.get('createdAt'),
                      helpers.getShortDateWithTimeFormat()
                    )
                    return (
                      <div key={message.get('_id')}>
                        {!isMessageOwner && (
                          <div className={'message message-left'}>
                            <img
                              src={`/uploads/users/${ownerImage}`}
                              alt='Profile Image'
                              title={formattedDate}
                              data-uk-tooltip="{pos: 'left', animation: false}"
                            />
                            <div className='message-body'>{message.get('body')}</div>
                          </div>
                        )}
                        {isMessageOwner && (
                          <div className={'message message-right'}>
                            <div
                              className='message-body'
                              data-uk-tooltip="{pos:'right', animation: false}"
                              title={formattedDate}
                            >
                              {message.get('body')}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div ref={this.userTypingBubbles} className='user-is-typing-wrapper padding-10 uk-clearfix hide'>
                    <div className='chat-user-profile smaller' style={{ position: 'relative', float: 'left', left: 0 }}>
                      <img
                        className={'round profileImage'}
                        src={`/uploads/users/${currentConversation.get('partner').get('image') ||
                          'defaultProfile.jpg'}`}
                        alt=''
                      />
                    </div>
                    <div
                      className='user-is-typing hide-arrow'
                      style={{ marginLeft: 40, marginTop: 3, background: '#ddd', border: 'none' }}
                    >
                      <div className='dot' />
                      <div className='dot' />
                      <div className='dot' />
                    </div>
                  </div>
                </div>
              </div>
              <div className='message-textbox'>
                <form
                  action='#'
                  onSubmit={e =>
                    this.onSendMessageSubmit(
                      e,
                      currentConversation.get('_id'),
                      currentConversation.get('partner').get('_id')
                    )
                  }
                >
                  <input
                    type='text'
                    name={'chatMessage'}
                    placeholder={'Type your message...'}
                    onKeyDown={e =>
                      this.onSendMessageKeyDown(
                        e,
                        currentConversation.get('_id'),
                        currentConversation.get('partner').get('_id')
                      )
                    }
                  />
                  <button type={'submit'}>SEND</button>
                </form>
              </div>
            </GridItem>
          )}
        </Grid>
        <ul className='context-menu'>
          <li data-action={'delete'} style={{ color: '#d32f2f' }}>
            Delete Conversation
          </li>
        </ul>
      </div>
    )
  }
}

MessagesContainer.propTypes = {
  sessionUser: PropTypes.object,
  socket: PropTypes.object.isRequired,
  fetchConversations: PropTypes.func.isRequired,
  unloadConversations: PropTypes.func.isRequired,
  fetchSingleConversation: PropTypes.func.isRequired,
  unloadSingleConversation: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  receiveMessage: PropTypes.func.isRequired,
  messagesState: PropTypes.object.isRequired,
  initialConversation: PropTypes.string
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser,
  socket: state.shared.socket,
  messagesState: state.messagesState
})

export default connect(mapStateToProps, {
  fetchConversations,
  unloadConversations,
  fetchSingleConversation,
  unloadSingleConversation,
  sendMessage,
  receiveMessage
})(MessagesContainer)
