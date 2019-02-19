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

import $ from 'jquery'
import UIkit from 'uikit'

class Menu extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    if (this.props.draggable) {
      const menu = $(this.menu)
      this.menuSortable = UIkit.sortable(menu, {
        handleClass: 'drag-handle'
      })

      if (this.props.onMenuDrag) this.menuSortable.on('change.uk.sortable', this.props.onMenuDrag)
    }
  }

  componentDidUpdate () {
    if (this.props.draggable && !this.menuSortable) {
      const menu = $(this.menu)
      this.menuSortable = UIkit.sortable(menu, {
        handleClass: 'drag-handle'
      })

      if (this.props.onMenuDrag) this.menuSortable.on('change.uk.sortable', this.props.onMenuDrag)
    }
  }

  render () {
    const { hideBorders } = this.props
    return (
      <ul
        ref={i => (this.menu = i)}
        className={'settings-categories scrollable' + (hideBorders ? ' noborder ' : '')}
        style={{ overflow: 'hidden auto' }}
      >
        {this.props.children}
      </ul>
    )
  }
}

Menu.propTypes = {
  hideBorders: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  draggable: PropTypes.bool,
  onMenuDrag: PropTypes.func
}

Menu.defaultProps = {
  draggable: false
}

export default Menu
