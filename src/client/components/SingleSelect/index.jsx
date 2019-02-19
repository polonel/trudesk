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
import { each, isArray, findIndex } from 'lodash'
import $ from 'jquery'

import helpers from 'lib/helpers'

class SingleSelect extends React.Component {
  value = ''
  constructor (props) {
    super(props)

    if (this.props.defaultValue) this.value = this.props.defaultValue

    this.onSelectChange = this.onSelectChange.bind(this)
  }

  componentDidMount () {
    helpers.UI.selectize()
    const $select = $(this.select)

    this.updateSelectizeItems()
    $select.on('change', this.onSelectChange)
    if (this.props.multiple) this.value = []
    if (this.props.defaultValue) this.value = this.props.defaultValue
  }

  componentWillUnmount () {
    const selectize = this.select.selectize
    if (selectize) selectize.destroy()
  }

  onSelectChange (e) {
    if (e.target.value === '') return

    if (this.props.multiple) this.value = this.select.selectize.items
    else this.value = e.target.value

    if (this.value && this.props.onSelectChange) this.props.onSelectChange(e)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.defaultValue !== this.props.defaultValue && !this.value) this.value = this.props.defaultValue

    this.updateSelectizeItems()
  }

  updateSelectizeItems () {
    if (this.select && this.select.selectize) {
      const self = this
      // Remove any options that were removed from Items array
      each(this.select.selectize.options, function (i) {
        const indexOfOption = findIndex(self.props.items, o => {
          return i.value === o.value
        })
        if (indexOfOption === -1) {
          self.select.selectize.removeOption(i.value, true)
        }
      })

      // Populate Options & Add existing selected values
      this.select.selectize.addOption(this.props.items)
      this.select.selectize.refreshOptions(false)
      this.select.selectize.addItem(this.value, true)

      // Force an update of each item from items prop
      each(this.props.items, function (i) {
        self.select.selectize.updateOption(i.value, i)
      })

      this.props.disabled ? this.select.selectize.disable() : this.select.selectize.enable()
    }
  }

  render () {
    let width = '100%'

    if (this.props.width) width = this.props.width

    const value = this.props.multiple && !isArray(this.value) ? [this.value] : this.value

    return (
      <div className={'uk-clearfix'}>
        <div className='uk-width-1-1 uk-float-right' style={{ paddingRight: '10px', width: width }}>
          <select
            className='selectize'
            ref={select => {
              this.select = select
            }}
            data-md-selectize-inline
            data-md-selectize-notextbox={this.props.showTextbox ? 'false' : 'true'}
            value={value}
            onChange={() => {}}
            disabled={this.props.disabled}
            data-md-selectize-bottom='true'
            multiple={this.props.multiple}
            data-md-selectize-top-offset='-32'
          />
        </div>
      </div>
    )
  }
}

SingleSelect.propTypes = {
  width: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  multiple: PropTypes.bool,
  showTextbox: PropTypes.bool,
  defaultValue: PropTypes.string,
  disabled: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onSelectChange: PropTypes.func
}

SingleSelect.defaultProps = {
  showTextbox: true,
  disabled: false,
  multiple: false
}

export default SingleSelect
