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
 *  Updated:    2/22/19 11:40 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

import helpers from 'lib/helpers'

class PageContent extends React.Component {
  componentDidMount () {
    helpers.resizeFullHeight()
    helpers.setupScrollers()
  }

  render () {
    return (
      <div
        id={this.props.id}
        className={'page-content no-border-top full-height scrollable ' + (this.props.extraClass || '')}
        style={{ padding: this.props.padding }}
      >
        <div style={{ paddingBottom: this.props.paddingBottom }}>{this.props.children}</div>
      </div>
    )
  }
}

PageContent.propTypes = {
  id: PropTypes.string,
  padding: PropTypes.number,
  paddingBottom: PropTypes.number,
  extraClass: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

PageContent.defaultProps = {
  padding: 25,
  paddingBottom: 100
}

export default PageContent
