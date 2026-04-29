import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { PopoverColorPicker } from 'components/PopoverColorPicker'
import Button from 'components/Button'
import BaseModal from 'containers/Modals/BaseModal'

import { createNotice } from 'actions/notices'

import helpers from 'lib/helpers'
import $ from 'jquery'

function CreateNoticeModal ({ createNotice }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [color, setColor] = useState('#4CAF50')
  const [fontColor, setFontColor] = useState('#ffffff')

  useEffect(() => {
    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    helpers.formvalidator()
  }, [])

  useEffect(() => {
    helpers.UI.reRenderInputs()
  })

  const onFormSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    createNotice({ name, message, color, fontColor }).then(() => {
      helpers.resizeAll()
    })
  }

  return (
    <BaseModal options={{ bgclose: false }}>
      <div className={'mb-25'}>
        <h2>Create Notice</h2>
      </div>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
        <div className={'uk-margin-medium-bottom'}>
          <label>Name</label>
          <input
            type='text'
            className={'md-input'}
            value={name}
            onChange={e => setName(e.target.value)}
            data-validation='length'
            data-validation-length={'min2'}
            data-validation-error-msg={'Please enter a notice name. (Must contain 2 characters)'}
          />
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label>Message</label>
          <textarea
            className={'md-input'}
            value={message}
            onChange={e => setMessage(e.target.value)}
            data-validation='length'
            data-validation-length={'min10'}
            data-validation-error-msg={'Please enter a notice message. (Must contain 10 characters)'}
          />
        </div>
        <div>
          <span style={{ display: 'inline-block', float: 'left', paddingTop: 5 }}>Background Color</span>
          <PopoverColorPicker
            color={color}
            onChange={c => setColor(c)}
            style={{ float: 'left', marginLeft: 5, marginRight: 15 }}
          />
          <span style={{ display: 'inline-block', float: 'left', paddingTop: 5 }}>Font Color</span>
          <PopoverColorPicker
            color={fontColor}
            onChange={c => setFontColor(c)}
            style={{ float: 'left', marginLeft: 5 }}
          />
        </div>

        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Create Notice'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateNoticeModal.propTypes = {
  createNotice: PropTypes.func.isRequired
}

export default connect(null, { createNotice })(CreateNoticeModal)
