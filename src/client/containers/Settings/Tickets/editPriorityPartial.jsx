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

class EditPriorityPartial extends React.Component {
  constructor (props) {
    super(props)
  }

  toggleEditPriority () {
    const $parent = $(this.editPriorityRef).parent()
    const $v = $parent.find('.view-priority')
    const $e = $parent.find('.edit-priority')
    if ($v && $e) {
      $v.toggleClass('hide')
      $e.toggleClass('hide')
    }
  }

  onSubmitEditPriority (e, priority) {
    e.preventDefault()

    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return true

    const id = priority.get('_id')
    const name = e.target.name.value
    const overdueIn = e.target.overdueIn.value
    const htmlColor = e.target.htmlColor.value

    const self = this

    api.tickets
      .updatePriority({ id, name, overdueIn, htmlColor })
      .then(res => {
        Log.debug(res)
        self.toggleEditPriority()
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
    const { priority } = this.props
    return (
      <div className='edit-priority hide' style={{ paddingTop: '2px' }} ref={i => (this.editPriorityRef = i)}>
        <form onSubmit={e => this.onSubmitEditPriority(e, priority)}>
          <div className='uk-grid uk-grid-collapse uk-clearfix'>
            <div className='uk-width-1-4'>
              <label>Priority Name</label>
              <input name={'name'} type='text' className={'md-input'} defaultValue={priority.get('name')} />
            </div>
            <div className='uk-width-1-4 uk-padding-small-sides'>
              <label>SLA Overdue (minutes)</label>
              <input name={'overdueIn'} type='text' className={'md-input'} defaultValue={priority.get('overdueIn')} />
            </div>
            <div className='uk-width-1-4 uk-padding-small-sides'>
              <ColorSelector
                inputName={'htmlColor'}
                defaultColor={priority.get('htmlColor')}
                hideRevert={true}
                validationEnabled={true}
              />
            </div>
            <div className='uk-width-1-4'>
              <div className='md-btn-group uk-float-right uk-text-right mt-5'>
                <Button small={true} text={'Cancel'} onClick={() => this.toggleEditPriority()} />
                <Button text={'Save'} small={true} style={'success'} type={'submit'} />
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

EditPriorityPartial.propTypes = {
  priority: PropTypes.object.isRequired,
  fetchSettings: PropTypes.func.isRequired
}

export default connect(
  null,
  { fetchSettings }
)(EditPriorityPartial)
