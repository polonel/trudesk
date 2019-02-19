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
 *  Updated:    2/15/19 11:59 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class PermSwitchPartial extends React.Component {
  render () {
    const { title, checked, onChange, disabled } = this.props
    return (
      <div>
        <div style={{ padding: '0 10px' }}>
          <div className='uk-clearfix'>
            <div className='left'>
              <h6 style={{ padding: '0 0 0 15px', margin: '20px 0', fontSize: '16px', lineHeight: '14px' }}>{title}</h6>
            </div>
            <div className='right' style={{ position: 'relative' }}>
              <div className='md-switch md-green' style={{ margin: '18px 0 0 0' }}>
                <label>
                  Allow
                  <input type='checkbox' checked={checked} onChange={onChange} disabled={disabled} />
                  <span className='lever' />
                </label>
              </div>
            </div>
          </div>
        </div>
        <hr className='nomargin-top clear' />
      </div>
    )
  }
}

PermSwitchPartial.propTypes = {
  title: PropTypes.string.isRequired,
  checked: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
}

export default PermSwitchPartial
