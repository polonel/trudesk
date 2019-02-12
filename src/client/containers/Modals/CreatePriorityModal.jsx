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
 *  Updated:    2/4/19 1:47 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import { createPriority } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import ColorSelector from 'components/ColorSelector'

import $ from 'jquery'
import helpers from 'lib/helpers'

@observer
class CreatePriorityModal extends React.Component {
  @observable name = ''
  @observable overdueIn = 2880
  @observable htmlColor = '#29B995'

  componentDidMount () {
    helpers.UI.inputs()
    helpers.formvalidator()
  }

  onCreatePrioritySubmit (e) {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return true

    //  Form is valid... Submit..
    this.props.createPriority({
      name: this.name,
      overdueIn: this.overdueIn,
      htmlColor: this.htmlColor
    })
  }

  render () {
    return (
      <BaseModal {...this.props} ref={i => (this.base = i)}>
        <form className={'uk-form-stacked'} onSubmit={e => this.onCreatePrioritySubmit(e)}>
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
                    value={this.name}
                    onChange={e => (this.name = e.target.value)}
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
                    value={this.overdueIn}
                    onChange={e => (this.overdueIn = e.target.value)}
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
                    onChange={e => (this.htmlColor = e.target.value)}
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
}

CreatePriorityModal.propTypes = {
  onPriorityCreated: PropTypes.func,
  createPriority: PropTypes.func.isRequired
}

export default connect(
  null,
  { createPriority }
)(CreatePriorityModal)
