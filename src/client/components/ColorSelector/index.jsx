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
import helpers from 'lib/helpers'

class ColorSelector extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedColor: ''
    }
  }

  componentDidMount () {
    helpers.UI.inputs()
    this.setState({ selectedColor: this.props.defaultColor }, this.updateColorButton)
  }

  componentDidUpdate (prevProps) {
    if (this.props.defaultColor !== prevProps.defaultColor)
      this.setState(
        {
          selectedColor: this.props.defaultColor
        },
        this.updateColorButton
      )
  }

  static getRandomColor () {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)]

    return color
  }

  static getContrast (hexcolor) {
    hexcolor = hexcolor.replace('#', '')
    if (hexcolor.length === 3) {
      const v = hexcolor[0]
      hexcolor = hexcolor + v + v + v
    }
    const r = parseInt(hexcolor.substr(0, 2), 16)
    const g = parseInt(hexcolor.substr(2, 2), 16)
    const b = parseInt(hexcolor.substr(4, 2), 16)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#444' : '#f7f8fa'
  }

  generateRandomColor (event) {
    event.preventDefault()
    const $currentTarget = $(event.target)
    if ($currentTarget.length > 0) {
      const color = ColorSelector.getRandomColor()
      if (this.props.onChange) {
        event.target.value = color
        this.props.onChange(event)
      }
      this.setState(
        {
          selectedColor: color
        },
        () => {
          this.updateColorButton()
        }
      )
    }
  }

  updateColorButton () {
    const fgColor = ColorSelector.getContrast(this.state.selectedColor.substring(1))
    $(this.colorButton).css({ background: this.state.selectedColor, color: fgColor })
  }

  onInputValueChange (e) {
    const val = e.target.value
    if (this.props.onChange) this.props.onChange(e)

    this.setState(
      {
        selectedColor: val
      },
      this.updateColorButton
    )
  }

  revertColor () {
    this.setState(
      {
        selectedColor: this.props.defaultColor
      },
      this.updateColorButton
    )
  }

  render () {
    return (
      <div className={this.props.parentClass}>
        <div className='uk-float-left uk-width-1-4'>
          <button
            ref={colorButton => {
              this.colorButton = colorButton
            }}
            className='uk-button uk-button-small uk-color-button mr-5 mt-10'
            style={{ float: 'right' }}
            onClick={e => {
              this.generateRandomColor(e)
            }}
          >
            <i className='material-icons'>refresh</i>
          </button>
        </div>
        <div
          className='md-input-wrapper uk-float-left md-input-filled'
          style={{ width: this.props.hideRevert ? '70%' : '50%' }}
        >
          <label>Color</label>
          {this.props.validationEnabled && (
            <input
              name={this.props.inputName ? this.props.inputName : ''}
              type='text'
              className='md-input'
              value={this.state.selectedColor}
              onChange={e => {
                this.onInputValueChange(e)
              }}
              data-validation='custom'
              data-validation-regexp='^\#([0-9a-fA-F]){3,6}$'
              data-validation-error-msg='Invalid HEX Color'
            />
          )}
          {!this.props.validationEnabled && (
            <input
              name={this.props.inputName ? this.props.inputName : ''}
              type='text'
              className='md-input'
              value={this.state.selectedColor}
              onChange={e => {
                this.onInputValueChange(e)
              }}
            />
          )}
          <div className='md-input-bar' />
        </div>
        {!this.props.hideRevert && (
          <button
            className={'md-btn md-btn-small md-btn-flat mt-10 uk-float-right uk-width-1-4'}
            onClick={() => {
              this.revertColor()
            }}
          >
            Revert
          </button>
        )}
      </div>
    )
  }
}

ColorSelector.propTypes = {
  inputName: PropTypes.string,
  defaultColor: PropTypes.string.isRequired,
  hideRevert: PropTypes.bool,
  parentClass: PropTypes.string,
  onChange: PropTypes.func,
  validationEnabled: PropTypes.bool
}

ColorSelector.defaultProps = {
  defaultColor: '#878982',
  hideRevert: false,
  validationEnabled: false
}

export default ColorSelector
