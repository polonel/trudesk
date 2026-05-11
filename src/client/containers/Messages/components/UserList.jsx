import React from 'react'
import PropTypes from 'prop-types'
import _helpers from 'lib/helpers'
import Avatar from 'components/Avatar/Avatar'

const UserList = ({
  userListShown,
  mutableUserList,
  userListSearchText,
  sessionUser,
  onUserListSearchChange,
  onUserStartConversationClick
}) => {
  // Memoize user list to prevent unnecessary re-renders
  const userListItems = React.useMemo(() => {
    return mutableUserList.map(account => {
      const accountImage = account.get('image') || 'defaultProfile.jpg'
      // Skip current user
      if (account.get('_id').toString() === sessionUser._id.toString()) return null
      
      return (
        <li 
          key={account.get('_id')} 
          onClick={() => onUserStartConversationClick(account)}
        >
          <Avatar userId={account.get('_id')} image={accountImage} />
          <div className='convo-info'>
            <span className='message-from'>{account.get('fullname')}</span>
            <span className='message-date'>{account.get('title')}</span>
            <span className='message-subject'>
              <a href={`mailto:${account.get('email')}`}>{account.get('email')}</a>
            </span>
          </div>
        </li>
      )
    })
  }, [mutableUserList, sessionUser, onUserStartConversationClick])

  if (!userListShown) return null

  return (
    <div id='conversationUserList' className='page-content-left noborder full-height'>
      <div className='search-box'>
        <input
          type='text'
          placeholder={'Search'}
          value={userListSearchText}
          onChange={e => onUserListSearchChange(e)}
        />
      </div>
      <ul className='message-items scrollable'>
        {userListItems}
      </ul>
    </div>
  )
}

UserList.propTypes = {
  userListShown: PropTypes.bool.isRequired,
  mutableUserList: PropTypes.object.isRequired, // Immutable.js List
  userListSearchText: PropTypes.string.isRequired,
  sessionUser: PropTypes.object.isRequired,
  onUserListSearchChange: PropTypes.func.isRequired,
  onUserStartConversationClick: PropTypes.func.isRequired
}

export default UserList
