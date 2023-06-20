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
 *  Updated:    2/5/19 3:16 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import $ from 'jquery'

import ColorSelector from 'components/ColorSelector'
import Button from 'components/Button'

import { fetchSettings } from 'actions/settings'
import api from 'api/index'
import Log from '../../../logger'
import helpers from 'lib/helpers'

class EditStatusPartial extends React.Component {
  constructor (props) {
    super(props)
  }

  toggleEditStatus () {
    const $parent = $(this.editStatusRef).parent()
    const $v = $parent.find('.view-status')
    const $e = $parent.find('.edit-status')
    if ($v && $e) {
      $v.toggleClass('hide')
      $e.toggleClass('hide')
    }
  }

  onSubmitEditStatus (e, status) {
    e.preventDefault()

    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return true

    const id = status.get('_id')
    const name = e.target.name.value
    const htmlColor = e.target.htmlColor.value

    const self = this

    api.tickets
      .updateStatus({ id, name, htmlColor })
      .then(res => {
        Log.debug(res)
        self.toggleEditStatus()
        this.props.fetchSettings()
      })
      .catch(err => {
        if (!err.response) {
          Log.error(err)
          return
        }

        const errorText = err.response.data.error
        Log.error(errorText, err.response)
        helpers.UI.showSnackbar(`Error: ${errorText}`, true)
      })
  }

  render () {
    const { status } = this.props
    return (
      <div className='edit-status hide' style={{ paddingTop: '2px' }} ref={i => (this.editStatusRef = i)}>
        <form onSubmit={e => this.onSubmitEditStatus(e, status)}>
          <div className='uk-grid uk-grid-collapse uk-clearfix'>
            <div className='uk-width-1-4'>
              <label>Status Name</label>
              <input name={'name'} type='text' className={'md-input'} defaultValue={status.get('name')} />
            </div>
            <div className='uk-width-1-4 uk-padding-small-sides'>
              <ColorSelector
                inputName={'htmlColor'}
                defaultColor={status.get('htmlColor')}
                hideRevert={true}
                validationEnabled={true}
              />
            </div>
            <div className='uk-width-1-4'>
              <div className='md-btn-group uk-float-right uk-text-right mt-5'>
                <Button small={true} text={'Cancel'} onClick={() => this.toggleEditStatus()} />
                <Button text={'Save'} small={true} style={'success'} type={'submit'} />
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

EditStatusPartial.propTypes = {
  status: PropTypes.object.isRequired,
  fetchSettings: PropTypes.func.isRequired
}

export default connect(
  null,
  { fetchSettings }
)(EditStatusPartial)
