import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import helpers from 'lib/helpers'
import Avatar from 'components/Avatar/Avatar'

const ConversationList = ({
  conversations,
  currentConversation,
  onConversationClicked,
  setupContextMenu
}) => {
  // Memoize the conversation list to prevent unnecessary re-renders
  const conversationItems = React.useMemo(() => {
    return conversations.map(convo => {
      const partnerId = convo.get('partner').get('_id')
      const partnerImage = convo.get('partner').get('image') || 'defaultProfile.jpg'
      const updatedDate = helpers.getCalendarDate(convo.get('updatedAt'))
      const isCurrentConversation = !!(
        currentConversation &&
        currentConversation.toJS()._id.toString() === convo.toJS()._id.toString()
      )

      return (
        <li
          key={convo.get('_id')}
          className={clsx(isCurrentConversation && 'active')}
          data-conversation-id={convo.get('_id')} // Used for ContextMenu
          onClick={() => onConversationClicked(convo.get('_id'))}
        >
          <Avatar userId={partnerId} image={partnerImage} />
          <div className='convo-info'>
            <span className='message-from'>{convo.get('partner').get('fullname')}</span>
            <span className='message-date'>{updatedDate}</span>
            <span className='message-subject'>{convo.get('recentMessage')}</span>
          </div>
        </li>
      )
    })
  }, [conversations, currentConversation, onConversationClicked])

  React.useEffect(() => {
    setupContextMenu()
  }, [setupContextMenu])

  return (
    <div id={'conversationList'} className='page-content-left noborder full-height'>
      <ul className='message-items scrollable'>
        {conversationItems}
      </ul>
    </div>
  )
}

ConversationList.propTypes = {
  conversations: PropTypes.object.isRequired, // Immutable.js List
  currentConversation: PropTypes.object,
  onConversationClicked: PropTypes.func.isRequired,
  setupContextMenu: PropTypes.func.isRequired
}

export default ConversationList
