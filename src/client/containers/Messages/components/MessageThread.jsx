import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import helpers from 'lib/helpers'
import SpinLoader from 'components/SpinLoader'
import Avatar from 'components/Avatar/Avatar'

const MessageThread = ({
  currentConversation,
  singleConversationLoaded,
  sessionUser,
  onSendMessageSubmit,
  onSendMessageKeyDown,
  messagesContainer,
  conversationScrollSpy,
  userTypingBubbles
}) => {
  if (!currentConversation) return null

  // Memoize message items to prevent unnecessary re-renders
  const messageItems = React.useMemo(() => {
    return currentConversation.get('messages').map(message => {
      const ownerImage = message.get('owner').get('image') || 'defaultProfile.jpg'
      // Handle case where sessionUser might be null
      const isMessageOwner = sessionUser 
        ? message
          .get('owner')
          .get('_id')
          .toString() === sessionUser._id
        : false
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
    })
  }, [currentConversation, sessionUser])

  return (
    <div className='page-message uk-position-relative full-height'>
      <SpinLoader active={!singleConversationLoaded} animate={true} animateDelay={300} />
      <div
        ref={messagesContainer}
        className='page-content page-content-right full-height scrollable'
        data-offset={41}
        style={{ marginBottom: '41px !important' }}
      >
        <span className={'conversation-start'}>
          Conversation Started on{' '}
          {helpers.formatDate(currentConversation.get('createdAt'), helpers.getLongDateWithTimeFormat())}
        </span>
        {currentConversation.get('requestingUserMeta').get('deletedAt') && (
          <span className={'conversation-deleted'}>
            Conversation Deleted at{' '}
            {helpers.formatDate(
              currentConversation.get('requestingUserMeta').get('deletedAt'),
              helpers.getLongDateWithTimeFormat()
            )}
          </span>
        )}
        <div ref={conversationScrollSpy} className={clsx('uk-text-center', 'uk-hidden')}>
          <i className='uk-icon-refresh uk-icon-spin' />
        </div>
        <div id={'messages'}>
          {messageItems}

          <div ref={userTypingBubbles} className='user-is-typing-wrapper padding-10 uk-clearfix hide'>
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
            onSendMessageSubmit(
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
              onSendMessageKeyDown(
                e,
                currentConversation.get('_id'),
                currentConversation.get('partner').get('_id')
              )
            }
          />
          <button type={'submit'}>SEND</button>
        </form>
      </div>
    </div>
  )
}

MessageThread.propTypes = {
  currentConversation: PropTypes.object,
  singleConversationLoaded: PropTypes.bool.isRequired,
  sessionUser: PropTypes.object, // Make it optional
  onSendMessageSubmit: PropTypes.func.isRequired,
  onSendMessageKeyDown: PropTypes.func.isRequired,
  messagesContainer: PropTypes.object.isRequired,
  conversationScrollSpy: PropTypes.object.isRequired,
  userTypingBubbles: PropTypes.object.isRequired
}

export default MessageThread
