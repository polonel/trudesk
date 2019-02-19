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
import { merge } from 'lodash'

class EnableSwitch extends React.Component {
  render () {
    const combinedStyle = merge({ margin: '17px 0 0 0' }, this.props.style)
    return (
      <div className='uk-float-right md-switch md-green' style={combinedStyle}>
        <label>
          {this.props.label}
          <input
            type='checkbox'
            id={this.props.stateName}
            name={this.props.stateName}
            onChange={this.props.onChange}
            checked={this.props.checked}
            disabled={this.props.disabled}
          />
          <span className='lever' />
        </label>
      </div>
    )
  }
}

EnableSwitch.propTypes = {
  stateName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  style: PropTypes.object,
  onChange: PropTypes.func,
  checked: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  disabled: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
}

export default EnableSwitch
