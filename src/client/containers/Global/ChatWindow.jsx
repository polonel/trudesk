import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import {
  MESSAGES_UI_USER_TYPING,
  MESSAGES_SAVE_CHAT_WINDOW,
  MESSAGES_SAVE_CHAT_WINDOW_COMPLETE
} from 'serverSocket/socketEventConsts'
import { sendMessage } from 'actions/messages'
import { setSessionUser } from 'actions/common'

import axios from 'axios'
import anime from 'animejs'
import $ from 'jquery'
import 'autogrow'
import helpers from 'lib/helpers'

@observer
class ChatWindow extends React.Component {
  containerRef = createRef()
  messageBoxRef = createRef()
  messagesRef = createRef()

  @observable conversation = null
  @observable messagesPage = 0

  constructor (props) {
    super(props)

    makeObservable(this)

    this.onChatTextBoxGrow = this.onChatTextBoxGrow.bind(this)
    this.onUserTyping = this.onUserTyping.bind(this)
    this.onSaveChatWindowComplete = this.onSaveChatWindowComplete.bind(this)
  }

  componentDidMount () {
    this.getConversation()
    this.props.socket.on(MESSAGES_UI_USER_TYPING, this.onUserTyping)
    this.props.socket.on(MESSAGES_SAVE_CHAT_WINDOW_COMPLETE, this.onSaveChatWindowComplete)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    helpers.setupScrollers()
    if (this.messagesRef.current) {
      helpers.scrollToBottom(this.messagesRef.current)
    }

    if (this.messageBoxRef.current) {
      const pThis = this
      $(this.messageBoxRef.current).autogrow({
        postGrowCallback: this.onChatTextBoxGrow,
        enterPressed: (self, v) => {
          pThis.onSendMessage(v)
        }
      })
    }
  }

  componentWillUnmount () {
    this.props.socket.off(MESSAGES_UI_USER_TYPING, this.onUserTyping)
    this.props.socket.off(MESSAGES_SAVE_CHAT_WINDOW_COMPLETE, this.onSaveChatWindowComplete)
  }

  onUserTyping (data) {
    // console.log(data)
  }

  onChatTextBoxGrow (self, oldHeight, newHeight) {
    if (oldHeight === newHeight || !this.messagesRef.current) return

    const $messages = $(this.messagesRef.current)
    $messages.css({ 'min-height': '170px', 'max-height': '220px' })
    self.parent().css({ 'max-height': '77px', 'min-height': '16px' })

    if (newHeight < 80) $messages.height($messages.height() - (newHeight - oldHeight))

    $messages.scrollTop($messages[0].scrollHeight)
  }

  getConversation () {
    if (!this.props.conversationId) return

    axios
      .get(`/api/v2/messages/conversations/${this.props.conversationId}`)
      .then(res => {
        console.log(res.data)
        if (res.data.success && res.data.conversation) this.conversation = res.data.conversation
      })
      .catch(e => {
        console.log(e)
      })
  }

  onSendMessage (text) {
    console.log(text)
  }

  onTitleClicked (e) {
    e.preventDefault()

    if (this.containerRef.current) {
      const topValue = this.containerRef.current.offsetTop
      anime({
        targets: this.containerRef.current,
        top: topValue === -280 ? '-29px' : '-280px',
        duration: 250,
        easing: 'easeInOutCirc'
      })
    }
  }

  onCloseClicked (e) {
    e.preventDefault()
    if (this.containerRef.current) {
      $(this.containerRef.current).hide()
    }

    // Save chat window
    this.props.socket.emit(MESSAGES_SAVE_CHAT_WINDOW, {
      userId: this.props.sessionUser._id,
      convoId: this.props.conversationId,
      remove: true
    })
  }

  onSaveChatWindowComplete () {
    this.props.setSessionUser()
  }

  render () {
    if (!this.props.sessionUser || !this.conversation) return null
    return (
      <div ref={this.containerRef} className='chat-box-position'>
        <div className='chat-box'>
          <div className='chat-box-title'>
            <div className='chat-box-title-buttons right'>
              <a href='#' className='chatCloseBtn no-ajaxy'>
                <i className='material-icons material-icons-small' onClick={e => this.onCloseClicked(e)}>
                  close
                </i>
              </a>
            </div>
            <h4 className='chat-box-title-text-wrapper' onClick={e => this.onTitleClicked(e)}>
              <a href='#' className={'no-ajaxy'}>
                {this.conversation.partner.fullname}
              </a>
            </h4>
          </div>
          <div ref={this.messagesRef} className='chat-box-messages scrollable'>
            {this.conversation.messages.map(message => {
              if (message.owner._id.toString() === this.props.sessionUser._id.toString()) {
                return (
                  <div key={message._id} className={'chat-message chat-message-user uk-clearfix'}>
                    <div className='chat-text-wrapper'>
                      <div className='chat-text chat-text-user'>
                        <div className='chat-text-inner'>
                          <span>{message.body.replace(/\n\r?/g, '<br />')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              } else {
                // From Partner
                const imageUrl = message.owner.image || 'defaultProfile.jpg'
                return (
                  <div key={message._id} className={'chat-message uk-clearfix'}>
                    <div className='chat-user-profile'>
                      <img src={`/uploads/users/${imageUrl}`} alt={message.owner.fullname} />
                    </div>
                    <div className='chat-text-wrapper'>
                      <div className='chat-text'>
                        <div className='chat-text-inner'>
                          <span>{message.body.replace(/\n\r?/g, '<br />')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
          <div className='chat-box-text'>
            <textarea ref={this.messageBoxRef} rows='1' className='textAreaAutogrow autogrow-short'></textarea>
          </div>
        </div>
      </div>
    )
  }
}

ChatWindow.propTypes = {
  sessionUser: PropTypes.object,
  setSessionUser: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired,
  sendMessage: PropTypes.func.isRequired,
  conversationId: PropTypes.string.isRequired
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser,
  socket: state.shared.socket
})

export default connect(mapStateToProps, { sendMessage, setSessionUser })(ChatWindow)
