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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class SubmenuItem extends React.Component {
  render () {
    return (
      <div>
        {this.props.hasSeperator && <hr />}
        <li className={this.props.active ? ' active ' : ''}>
          <a href={this.props.href}>
            <i className='material-icons fa-sub-icon'>{this.props.icon}</i>
            {this.props.text}
          </a>
        </li>
      </div>
    )
  }
}

SubmenuItem.propTypes = {
  href: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  hasSeperator: PropTypes.bool,
  active: PropTypes.bool
}

export default SubmenuItem
