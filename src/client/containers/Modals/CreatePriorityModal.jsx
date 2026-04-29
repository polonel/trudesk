import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createPriority } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import ColorSelector from 'components/ColorSelector'

import $ from 'jquery'
import helpers from 'lib/helpers'

function CreatePriorityModal ({ createPriority }) {
  const [name, setName] = useState('')
  const [overdueIn, setOverdueIn] = useState(2880)
  const [htmlColor, setHtmlColor] = useState('#29B995')

  useEffect(() => {
    helpers.UI.inputs()
    helpers.formvalidator()
  }, [])

  const onCreatePrioritySubmit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return true

    createPriority({ name, overdueIn, htmlColor })
  }

  return (
    <BaseModal>
      <form className={'uk-form-stacked'} onSubmit={onCreatePrioritySubmit}>
        <div className='uk-margin-medium-bottom uk-clearfix'>
          <h2>Create Priority</h2>
        </div>

        <div>
          <div className='uk-clearfix'>
            <div className='z-box uk-grid uk-grid-collpase uk-clearfix'>
              <div className='uk-width-1-3'>
                <label>Priority Name</label>
                <input
                  type='text'
                  className={'md-input'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  data-validation='length'
                  data-validation-length='min3'
                  data-validation-error-msg='Invalid name (3+ characters)'
                />
              </div>
              <div className='uk-width-1-3'>
                <label>SLA Overdue (minutes)</label>
                <input
                  type='text'
                  className={'md-input'}
                  value={overdueIn}
                  onChange={e => setOverdueIn(e.target.value)}
                  data-validation='number'
                  data-validation-allowing='range[1;525600]'
                  data-validation-error-msg='Invalid SLA Time (1-525600)'
                />
              </div>
              <div className='uk-width-1-3'>
                <ColorSelector
                  hideRevert={true}
                  defaultColor={'#29B995'}
                  validationEnabled={true}
                  onChange={e => setHtmlColor(e.target.value)}
                />
              </div>
            </div>
            <div className='uk-modal-footer uk-text-right'>
              <Button text={'Cancel'} type={'button'} extraClass={'uk-modal-close'} flat={true} waves={true} />
              <Button text={'Create'} type={'submit'} flat={true} waves={true} style={'success'} />
            </div>
          </div>
        </div>
      </form>
    </BaseModal>
  )
}

CreatePriorityModal.propTypes = {
  onPriorityCreated: PropTypes.func,
  createPriority: PropTypes.func.isRequired
}

export default connect(null, { createPriority })(CreatePriorityModal)
