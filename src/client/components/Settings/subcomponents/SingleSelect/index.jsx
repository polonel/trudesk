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

class SingleSelect extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      value: this.props.value
    }
  }

  componentDidMount () {
    helpers.UI.selectize()
    const $select = $(this.select)
    $select.on('change', this.props.onSelectChange)
    this.setState({ value: this.props.value })
  }

  componentWillUnmount () {
    const selectize = this.select.selectize

    if (selectize) selectize.destroy()
  }

  static getDerivedStateFromProps (props, state) {
    if (props.value !== state.value) {
      return {
        value: props.value
      }
    }

    return null
  }

  render () {
    const { items } = this.props
    let width = '100%'

    if (this.select && this.select.selectize) {
      this.select.selectize.addOption(items)
      this.select.selectize.refreshOptions(false)
      this.select.selectize.addItem(this.state.value, true)
    }

    if (this.props.width) width = this.props.width

    return (
      <div className='uk-width-1-1 uk-float-right' style={{ paddingRight: '10px', width: width }}>
        <select
          className='selectize'
          ref={select => {
            this.select = select
          }}
          data-md-selectize
          data-md-selectize-bottom
          value={this.state.value}
          onChange={this.props.onSelectChange}
        >
          {items.map(function (obj, i) {
            return (
              <option key={i} value={obj.value}>
                {obj.text}
              </option>
            )
          })}
        </select>
      </div>
    )
  }
}

SingleSelect.propTypes = {
  value: PropTypes.string,
  width: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectChange: PropTypes.func.isRequired
}

export default SingleSelect
