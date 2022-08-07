/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/29/19 2:44 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

class Form extends React.Component {
  onSubmit (e) {
    e.preventDefault()
    const url = this.props.url
    const method = this.props.method
    const data = this.props.data
    const headers = this.props.headers

    if (this.props.onBeforeSend && typeof this.props.onBeforeSend === 'function') this.props.onBeforeSend(e)

    if (this.props.onValidate) {
      const result = this.props.onValidate(e, data)
      if (!result) return
    }

    axios({
      url,
      method,
      data,
      headers: { ...headers }
    })
      .then(res => {
        if (this.props.onCompleted) this.props.onCompleted(res)
      })
      .catch(error => {
        if (this.props.onError) this.props.onError(error)
        throw error
      })
  }

  render () {
    // We need to extract all the props that are not valid for an HTML Form
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    const { children, onBeforeSend, onValidate, onCompleted, onError, url, method, data, headers, ...rest } = this.props

    return (
      <form onSubmit={e => this.onSubmit(e)} {...rest}>
        {children}
      </form>
    )
  }
}

Form.propTypes = {
  url: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  data: PropTypes.object,
  headers: PropTypes.object,
  children: PropTypes.any.isRequired,
  onCompleted: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onBeforeSend: PropTypes.func,
  onValidate: PropTypes.func
}

export default Form
