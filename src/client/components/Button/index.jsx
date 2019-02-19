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

import isUndefined from 'lodash/isUndefined'
import React from 'react'
import PropTypes from 'prop-types'

import helpers from 'lib/helpers'

class Button extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    helpers.UI.waves()
  }

  render () {
    const { type, small, flat, style, text, onClick, waves, disabled, extraClass, styleOverride } = this.props
    const classBuild =
      (small ? ' md-btn-small ' : '') +
      (flat ? ' md-btn-flat ' : '') +
      (waves ? ' md-btn-wave ' : '') +
      (style && flat ? ' md-btn-flat-' + style : style ? ' md-btn-' + style : '') +
      (disabled ? ' disabled ' : '') +
      ' ' +
      extraClass
    return (
      <button
        className={'md-btn' + classBuild}
        onClick={onClick}
        type={type ? type : 'button'}
        disabled={disabled}
        style={styleOverride}
      >
        {text}
      </button>
    )
  }
}

Button.propTypes = {
  type: PropTypes.string,
  text: PropTypes.string.isRequired,
  flat: PropTypes.bool,
  style: PropTypes.string,
  styleOverride: PropTypes.object,
  small: PropTypes.bool,
  waves: PropTypes.bool,
  disabled: PropTypes.bool,
  extraClass: PropTypes.string,
  onClick: PropTypes.func
}

Button.defaultProps = {
  disabled: false
}

export default Button
