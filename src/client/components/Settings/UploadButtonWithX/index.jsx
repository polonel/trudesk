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

import axios from 'api/axios'

import $ from 'jquery'
import logger from '../../../logger'
import helpers from 'lib/helpers'

class UploadButtonWithX extends React.Component {
  constructor (props) {
    super(props)

    this.uploadSelect = React.createRef()
  }

  onFileChange () {
    if (!this.uploadSelect.current) return
    const sanitizedAllowedExt = this.props.extAllowed.replace('*.', '')

    const matches = this.uploadSelect.current.files[0]?.name.match(sanitizedAllowedExt)
    if (matches < 1) {
      logger.error('Invalid file type: ' + sanitizedAllowedExt)
      helpers.UI.showSnackbar('Invalid file type', true)
      this.uploadSelect.current.value = ''
      return
    }

    const $uploadButton = $(this.uploadButton)
    const $buttonX = $(this.buttonX)

    // Load Start
    $uploadButton.text('Uploading...')
    $uploadButton.attr('disabled', true)
    $uploadButton.addClass('disable')

    const formData = new FormData()
    formData.append('file', this.uploadSelect.current.files[0])
    axios
      .post(this.props.uploadAction, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(() => {
        $uploadButton.text('Upload Logo')
        $uploadButton.attr('disabled', false)
        $uploadButton.removeClass('disable')
        helpers.UI.showSnackbar('Upload Complete. Reloading...', false)

        setTimeout(function () {
          window.location.reload()
        }, 1000)
        $buttonX.removeClass('hide')
      })
      .catch(err => {
        logger.error(err)
      })
  }

  render () {
    const { buttonText, showX, onXClick } = this.props

    return (
      <div>
        <button
          ref={x => {
            this.buttonX = x
          }}
          className={`md-btn md-btn-danger md-btn-small right ${showX ? '' : 'hide'}`}
          onClick={onXClick}
          style={{ marginTop: '8px' }}
        >
          X
        </button>
        <button
          ref={button => {
            this.uploadButton = button
          }}
          className='uk-form-file md-btn md-btn-small right'
          style={{ marginTop: '8px', textTransform: 'none' }}
        >
          {buttonText}
          <input ref={this.uploadSelect} type='file' onChange={e => this.onFileChange(e)} />
        </button>
      </div>
    )
  }
}

UploadButtonWithX.propTypes = {
  buttonText: PropTypes.string.isRequired,
  uploadAction: PropTypes.string.isRequired,
  extAllowed: PropTypes.string.isRequired,
  showX: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onXClick: PropTypes.func
}

export default UploadButtonWithX
