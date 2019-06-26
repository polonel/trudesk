/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/22/19 12:37 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import helpers from 'lib/helpers'

class TruTabSelectors extends React.Component {
  componentDidMount () {
    helpers.setupTruTabs(document.querySelectorAll('.tru-tab-selectors > .tru-tab-selector'))
  }

  render () {
    const { children, showTrack } = this.props
    return (
      <div className='tru-tab-selectors' style={this.props.style} ref={r => (this.selectors = r)}>
        {children}

        <span className='tru-tab-highlighter' />
        {showTrack && <span className='tru-tab-hr tru-tab-hr-lighten' />}
      </div>
    )
  }
}

TruTabSelectors.propTypes = {
  showTrack: PropTypes.bool,
  style: PropTypes.object
}

TruTabSelectors.defaultProps = {
  showTrack: true
}

export default TruTabSelectors
