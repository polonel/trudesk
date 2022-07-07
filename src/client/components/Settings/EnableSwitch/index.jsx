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

import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { merge } from 'lodash'
import clsx from 'clsx'

class EnableSwitch extends React.Component {
  labelRef = createRef()

  onLevelClick (e) {
    e.preventDefault()
    if (this.labelRef.current) {
      this.labelRef.current.click()
    }
  }

  render () {
    const combinedStyle = merge({ margin: '17px 0 0 0' }, this.props.style)
    return (
      <div className='md-switch-wrapper md-switch md-green uk-float-right uk-clearfix' style={combinedStyle}>
        <label ref={this.labelRef} htmlFor={this.props.stateName} style={this.props.labelStyle || {}}>
          {this.props.label}
          {this.props.sublabel}
        </label>

        <input
          type='checkbox'
          id={this.props.stateName}
          name={this.props.stateName}
          onChange={this.props.onChange}
          checked={this.props.checked}
          disabled={this.props.disabled}
        />
        <span className={clsx('lever', this.props.leverClass)} onClick={e => this.onLevelClick(e)} />
      </div>
    )
  }
}

EnableSwitch.propTypes = {
  stateName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  labelStyle: PropTypes.object,
  sublabel: PropTypes.node,
  style: PropTypes.object,
  leverClass: PropTypes.string,
  onChange: PropTypes.func,
  checked: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  disabled: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
}

export default EnableSwitch
