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
 *  Updated:    2/10/19 2:41 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class Dropdown extends React.Component {
  render () {
    const { small, width, children, extraClass } = this.props
    const className = (small ? ' uk-dropdown-small ' : ' ') + (extraClass || '')
    return (
      <div
        className={'nopadding-left nopadding-right uk-dropdown uk-margin-top-remove' + className}
        style={{ width: width, minWidth: width }}
      >
        <ul className='uk-nav uk-topbar nomargin'>{children}</ul>
      </div>
    )
  }
}

Dropdown.propTypes = {
  small: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  extraClass: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

Dropdown.defaultProps = {
  width: 150
}

export default Dropdown
