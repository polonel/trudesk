/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/23/19 5:52 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import $ from 'jquery'
import helpers from 'lib/helpers'

class DatePicker extends React.Component {
  componentDidMount () {
    $(this.datepicker).on('change.uk.datepicker', e => {
      if (this.props.onChange) this.props.onChange(e)
    })
  }

  componentDidUpdate () {
    if (this.props.value) $(this.datepicker).val(helpers.formatDate(this.props.value, this.props.format))
    if (this.props.value === undefined) $(this.datepicker).val('')
  }

  componentWillUnmount () {
    $(this.datepicker).off('change.uk.datepicker')
  }

  render () {
    const { value, small, name, validation, readOnly } = this.props

    return (
      <Fragment>
        <input
          ref={r => (this.datepicker = r)}
          id={name}
          name={name}
          type='text'
          readOnly
          className={clsx('md-input', small && 'small-font', small && 'p-0')}
          data-uk-datepicker={`{format:'${this.props.format}'}`}
          data-validation={validation}
          style={this.style || { width: '97%' }}
          defaultValue={value ? helpers.formatDate(value, this.props.format) : ''}
        />
      </Fragment>
    )
  }
}

DatePicker.propTypes = {
  format: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  value: PropTypes.string,
  small: PropTypes.bool,
  validation: PropTypes.string,
  readOnly: PropTypes.bool
}

DatePicker.defaultProps = {
  small: false,
  validation: 'shortDate',
  readOnly: true
}

export default DatePicker
