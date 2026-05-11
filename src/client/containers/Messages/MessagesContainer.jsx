import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import history from 'lib/lib-history'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import {
  fetchConversations,
  fetchSingleConversation,
  setCurrentConversation,
  unloadSingleConversation,
  unloadConversations,
  deleteConversation,
  sendMessage,
  receiveMessage
} from 'actions/messages'
import {
  MESSAGES_USER_TYPING,
  MESSAGES_UI_USER_TYPING,
  MESSAGES_SEND,
  MESSAGES_UI_RECEIVE
} from 'serverSocket/socketEventConsts'

import PageTitle from 'components/PageTitle'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'

import { startConversation } from 'lib/chat/index'
import UIKit from 'uikit'
import $ from 'jquery'
import helpers from 'lib/helpers'
import { Helmet } from 'react-helmet-async'
import TitleContext from 'app/TitleContext'

// Import components
import ConversationList from './components/ConversationList'
import UserList from './components/UserList'
import MessageThread from './components/MessageThread'

@observer
class MessagesContainer extends React.Component {
  @observable userListShown = false
  @observable userListSearchText = ''
  @observable mutableUserList = []
  @observable singleConversationLoaded = false
  @observable typingTimers = {}
  @observable showNewConvoLoaded = false

  conversationScrollSpy = createRef()
  userTypingBubbles = createRef()
  messagesContainer = createRef()

  constructor (props) {
    super(props)

    makeObservable(this)

    this.setupContextMenu = this.setupContextMenu.bind(this)
    this.onReceiveMessage = this.onReceiveMessage.bind(this)
    this.onUserIsTyping = this.onUserIsTyping.bind(this)
    this.onUserStopTyping = this.onUserStopTyping.bind(this)
    this._stopTyping = this._stopTyping.bind(this)
    this.showUserList = this.showUserList.bind(this)
    this.hideUserList = this.hideUserList.bind(this)
    this.onUserListSearchChange = this.onUserListSearchChange.bind(this)
    this.onUserStartConversationClick = this.onUserStartConversationClick.bind(this)
    this.deleteConversation = this.deleteConversation.bind(this)
    this.scrollToMessagesBottom = this.scrollToMessagesBottom.bind(this)
    this.onConversationClicked = this.onConversationClicked.bind(this)
    this.onSendMessageKeyDown = this.onSendMessageKeyDown.bind(this)
    this.onSendMessageSubmit = this.onSendMessageSubmit.bind(this)
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

  componentDidUpdate (prevProps, _prevState, _snapshot) {
    helpers.resizeAll()
    helpers.setupScrollers()
    this.setupContextMenu()

    // Hack in a way to show the user list on the /startconversation route
    if (
      !prevProps.sessionUser &&
      this.props.sessionUser &&
      this.props.showNewConvo === 'true' &&
      !this.showNewConvoLoaded
    ) {
      this.showNewConvoLoaded = true
      this.showUserList()
    }
  }

  componentWillUnmount () {
    this.props.unloadAccounts()
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

  onUserStopTyping (_data) {
    // console.log(data)
  }

  showUserList (e) {
    if (e) e.preventDefault()
    if (this.props.sessionUser.role.isAdmin || this.props.sessionUser.role.isAgent)
      this.props.fetchAccounts({ type: 'all', limit: -1 }).then(() => {
        this.mutableUserList = this.props.accountsState.accounts
        this.userListShown = true
      })
    else
      this.props.fetchAccounts({ type: 'agents' }).then(() => {
        this.mutableUserList = this.props.accountsState.accounts
        this.userListShown = true
      })
  }

  hideUserList (e) {
    if (e) e.preventDefault()
    this.props.unloadAccounts()
    this.userListShown = false
  }

  onUserListSearchChange (e) {
    this.userListSearchText = e.target.value
    if (this.userListSearchText.length > 3) {
      this.mutableUserList = this.props.accountsState.accounts.filter(i =>
        i
          .get('fullname')
          .toLowerCase()
          .includes(this.userListSearchText.toLowerCase())
      )
    } else this.mutableUserList = this.props.accountsState.accounts
  }

  onUserStartConversationClick (account) {
    if (!account || !this.props.sessionUser) {
      helpers.UI.showSnackbar('Invalid participants', true)
      return false
    }

    startConversation(this.props.sessionUser._id, account.get('_id'))
      .then(conversation => {
        this.userListShown = false
        this.props.unloadAccounts()

        this.props.unloadConversations().then(() => {
          this.props.fetchConversations()
        })

        this.props.unloadSingleConversation().then(() => {
          this.singleConversationLoaded = false
          this.props.fetchSingleConversation({ _id: conversation._id }).then(() => {
            this.scrollToMessagesBottom(true)
          })
        })
      })
      .catch(err => {
        helpers.UI.showSnackbar(err.message, true)
      })
  }

  setupContextMenu () {
    const self = this
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
            self.deleteConversation(convoId)
          },
          // Cancel Function
          function () {},
          {
            labels: { Ok: 'YES' },
            confirmButtonClass: 'md-btn-danger'
          }
        )
      }
    })
  }

  deleteConversation (convoId) {
    this.props.deleteConversation({ convoId })
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
        history.push(`/messages/${id}`)
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
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Conversations</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
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

            {!this.userListShown && (
              <ConversationList 
                conversations={this.props.messagesState.conversations}
                currentConversation={this.props.messagesState.currentConversation}
                onConversationClicked={this.onConversationClicked}
                setupContextMenu={this.setupContextMenu}
              />
            )}
            {this.userListShown && (
              <UserList
                userListShown={this.userListShown}
                mutableUserList={this.mutableUserList}
                userListSearchText={this.userListSearchText}
                sessionUser={this.props.sessionUser}
                onUserListSearchChange={this.onUserListSearchChange}
                onUserStartConversationClick={this.onUserStartConversationClick}
              />
            )}
          </GridItem>
          {currentConversation && (
            <GridItem width={'7-10'} extraClass={'nopadding page-message uk-position-relative'}>
              <MessageThread
                currentConversation={currentConversation}
                singleConversationLoaded={this.singleConversationLoaded}
                sessionUser={this.props.sessionUser}
                onSendMessageSubmit={this.onSendMessageSubmit}
                onSendMessageKeyDown={this.onSendMessageKeyDown}
                messagesContainer={this.messagesContainer}
                conversationScrollSpy={this.conversationScrollSpy}
                userTypingBubbles={this.userTypingBubbles}
              />
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
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  accountsState: PropTypes.object.isRequired,
  fetchConversations: PropTypes.func.isRequired,
  unloadConversations: PropTypes.func.isRequired,
  deleteConversation: PropTypes.func.isRequired,
  fetchSingleConversation: PropTypes.func.isRequired,
  setCurrentConversation: PropTypes.func.isRequired,
  unloadSingleConversation: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  receiveMessage: PropTypes.func.isRequired,
  messagesState: PropTypes.object.isRequired,
  initialConversation: PropTypes.string,
  showNewConvo: PropTypes.string
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser,
  socket: state.shared.socket,
  messagesState: state.messagesState,
  accountsState: state.accountsState
})

export default connect(mapStateToProps, {
  fetchAccounts,
  unloadAccounts,
  fetchConversations,
  unloadConversations,
  deleteConversation,
  fetchSingleConversation,
  setCurrentConversation,
  unloadSingleConversation,
  sendMessage,
  receiveMessage
})(MessagesContainer)