/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    2/20/19 5:11 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

import helpers from 'lib/helpers'

class NoticeBanner extends React.Component {
  render () {
    const { notice } = this.props
    const dateFormatted = helpers.formatDate(
      notice.get('activeDate,'),
      helpers.getShortDateFormat() + ', ' + helpers.getTimeFormat()
    )

    return (
      <div
        style={{
          width: '100%',
          height: '30px',
          background: notice.get('color'),
          color: notice.get('fontColor'),
          fontSize: '13px',
          fontWeight: '500',
          textAlign: 'center',
          paddingTop: '7px'
        }}
      >
        {dateFormatted} Important: {notice.get('message')}
      </div>
    )
  }
}

NoticeBanner.propTypes = {
  notice: PropTypes.object.isRequired
}

export default NoticeBanner
