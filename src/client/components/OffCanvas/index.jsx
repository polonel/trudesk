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
 *  Updated:    2/12/19 11:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class OffCanvas extends React.Component {
  render () {
    const { title, id, children } = this.props
    return (
      <div id={id} className={'uk-offcanvas'}>
        <div className='uk-offcanvas-bar uk-offcanvas-bar-flip scrollable'>
          {title && (
            <div className='uk-offcanvas-title'>
              <h3>{title}</h3>
            </div>
          )}
          {children}
        </div>
      </div>
    )
  }
}

OffCanvas.propTypes = {
  title: PropTypes.string,
  id: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

export default OffCanvas
