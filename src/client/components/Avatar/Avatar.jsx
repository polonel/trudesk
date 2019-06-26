/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/22/19 12:54 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

class Avatar extends React.Component {
  render () {
    const { image, showOnlineBubble, userId, size } = this.props

    return (
      <Fragment>
        <div className='relative uk-clearfix uk-float-left uk-display-inline-block'>
          <img
            className='profile-pic uk-border-circle'
            style={{ height: size, width: size }}
            src={`/uploads/users/${image || 'defaultProfile.jpg'}`}
            alt=''
          />
          {showOnlineBubble && <span className='user-offline uk-border-circle' data-user-status-id={userId} />}
        </div>
      </Fragment>
    )
  }
}

Avatar.propTypes = {
  userId: PropTypes.string,
  image: PropTypes.string,
  size: PropTypes.number.isRequired,
  showOnlineBubble: PropTypes.bool
}

Avatar.defaultProps = {
  size: 50,
  showOnlineBubble: true
}

export default Avatar
