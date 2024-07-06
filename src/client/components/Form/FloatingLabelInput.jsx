/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    7/24/19 8:29 PM
 *  Copyright (c) 2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

class FloatingLabel extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this.props.value || '',
      isActive: this.props.value
    }

    this.updateValue = this.updateValue.bind(this)
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.value !== this.props.value)
      this.setState({
        value: this.props.value
      })
  }

  onFocus (e) {
    if (e.target.value !== '')
      this.setState({
        isActive: true
      })
  }

  onBlur (e) {
    if (e.target.value === '')
      this.setState({
        isActive: false
      })
  }

  updateValue (e) {
    const value = e.target.value
    this.setState(
      {
        value: value,
        isActive: value !== ''
      },
      () => {
        if (this.props.onChange) this.props.onChange(value)
      }
    )

    e.preventDefault()
  }

  render () {
    const { placeholder } = this.props
    const inputId = `floating-label-input-${placeholder.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className={clsx('FloatLabel', this.state.isActive && 'is-active')}>
        <input
          id={inputId}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          placeholder={placeholder}
          value={this.state.value}
          {...this.props}
          onChange={this.updateValue}
          className={clsx('Input-floatLabel FloatLabel-input')}
        />
        <label htmlFor={inputId} className='FloatLabel-label'>{placeholder}</label>
        {/*{touched && error && <label className='FloatLabel-label'>{placeholder + ' ' + error}</label>}*/}
      </div>
    )
  }
}

FloatingLabel.propTypes = {
  placeholder: PropTypes.string.isRequired,
  error: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

export default FloatingLabel
