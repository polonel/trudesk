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
 *  Updated:    2/10/19 2:57 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

import UIkit from 'uikit'

class DropdownTrigger extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    if (this.drop) {
      UIkit.dropdown(this.drop, {
        mode: this.props.mode,
        pos: this.props.pos,
        offset: this.props.offset
      })
    }
  }

  componentWillUnmount () {
    if (this.drop) this.drop = null
  }

  render () {
    return (
      <div
        ref={i => (this.drop = i)}
        className={'uk-position-relative' + (this.props.extraClass ? ' ' + this.props.extraClass : '')}
        aria-haspopup={true}
        aria-expanded={false}
      >
        {this.props.children}
      </div>
    )
  }
}

DropdownTrigger.propTypes = {
  mode: PropTypes.string,
  pos: PropTypes.string,
  offset: PropTypes.number,
  extraClass: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

DropdownTrigger.defaultProps = {
  mode: 'click',
  pos: 'bottom-left'
}

export default DropdownTrigger
