import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createStatus } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import ColorSelector from 'components/ColorSelector'

import $ from 'jquery'
import helpers from 'lib/helpers'
import EnableSwitch from 'components/Settings/EnableSwitch'

function CreateStatusModal ({ createStatus }) {
  const [name, setName] = useState('')
  const [htmlColor, setHtmlColor] = useState('#29B995')
  const [slatimer, setSlatimer] = useState(true)
  const [isResolved, setIsResolved] = useState(false)

  useEffect(() => {
    helpers.UI.inputs()
    helpers.formvalidator()
  }, [])

  const onCreateStatusSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return true

    createStatus({ name, htmlColor, slatimer, isResolved })
  }

  return (
    <BaseModal large={true}>
      <form className={'uk-form-stacked'} onSubmit={onCreateStatusSubmit}>
        <div className='uk-margin-medium-bottom uk-clearfix'>
          <h2>Create Status</h2>
        </div>

        <div>
          <div className='uk-clearfix'>
            <div className='z-box uk-grid uk-grid-collpase uk-clearfix'>
              <div className='uk-width-1-4'>
                <label>Status Name</label>
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

              <div className='uk-width-1-4'>
                <ColorSelector
                  hideRevert={true}
                  defaultColor={'#29B995'}
                  validationEnabled={true}
                  onChange={e => setHtmlColor(e.target.value)}
                />
              </div>
              <div className={'uk-width-1-4'}>
                <div className={'uk-float-left'}>
                  <EnableSwitch
                    stateName={'slatimer'}
                    label={'SLA'}
                    checked={slatimer}
                    onChange={e => setSlatimer(e.target.checked)}
                  />
                </div>
                <div className={'uk-float-left'}>
                  <EnableSwitch
                    stateName={'isResolved'}
                    label={'isResolved'}
                    checked={isResolved}
                    onChange={e => setIsResolved(e.target.checked)}
                  />
                </div>
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

CreateStatusModal.propTypes = {
  createStatus: PropTypes.func.isRequired
}

export default connect(null, { createStatus })(CreateStatusModal)
