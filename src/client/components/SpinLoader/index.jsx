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
 *  Updated:    2/7/19 7:06 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import $ from 'jquery'

class SpinLoader extends React.Component {
  constructor (props) {
    super(props)

    this.spinnerRef = createRef()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (this.spinnerRef.current && this.props.animate) {
      const $spinnerRef = $(this.spinnerRef.current)

      // Becoming Active
      if (!prevProps.active && this.props.active) {
        $spinnerRef.css({ opacity: 1 }).show()
      }

      // Becoming Inactive
      if (prevProps.active && !this.props.active) {
        $spinnerRef.animate({ opacity: 0 }, this.props.animateDelay, () => {
          $spinnerRef.hide()
        })
      }
    }
  }

  render () {
    return (
      <div
        ref={this.spinnerRef}
        className={clsx('card-spinner', this.props.extraClass, !this.props.active && !this.props.animate && 'hide')}
        style={this.props.style}
      >
        <div className='spinner' style={this.props.spinnerStyle} />
      </div>
    )
  }
}

SpinLoader.propTypes = {
  active: PropTypes.bool,
  extraClass: PropTypes.string,
  style: PropTypes.object,
  spinnerStyle: PropTypes.object,
  animate: PropTypes.bool,
  animateDelay: PropTypes.number
}

SpinLoader.defaultProps = {
  animate: false,
  animateDelay: 700
}

export default SpinLoader
