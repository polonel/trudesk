/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/22/19 1:05 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

class TruTabSection extends React.Component {
  render () {
    const { sectionId, active } = this.props
    return (
      <div
        className={clsx('tru-tab-section', !active && 'hidden')}
        data-tabid={sectionId}
        style={this.props.style || { paddingTop: 20 }}
      >
        {this.props.children}
      </div>
    )
  }
}

TruTabSection.propTypes = {
  sectionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  active: PropTypes.bool.isRequired,
  style: PropTypes.object
}

TruTabSection.defaultProps = {
  active: false
}

export default TruTabSection
