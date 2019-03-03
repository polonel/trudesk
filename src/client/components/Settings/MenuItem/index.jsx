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

class MenuItem extends React.Component {
  render () {
    const { title, active, onClick, draggable } = this.props
    return (
      <li className={active ? ' active' : ''} onClick={onClick} data-key={this.props.dragKey}>
        <div className='setting-category'>
          {draggable && (
            <span className='drag-handle uk-display-inline-block uk-float-left mr-10'>
              <i className='material-icons'>drag_handle</i>
            </span>
          )}
          <h3>{title}</h3>
        </div>
      </li>
    )
  }
}

MenuItem.propTypes = {
  title: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  draggable: PropTypes.bool,
  dragKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}

export default MenuItem
