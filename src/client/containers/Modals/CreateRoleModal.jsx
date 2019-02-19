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
 *  Updated:    2/16/19 4:29 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import { connect } from 'react-redux'

import { createRole } from 'actions/settings'

import Button from 'components/Button'
import BaseModal from './BaseModal'

@observer
class CreateRoleModal extends React.Component {
  @observable name = ''

  onNameChange (e) {
    this.name = e.target.value
  }

  onCreateRoleClicked (e) {
    e.preventDefault()

    this.props.createRole({ name: this.name })
  }

  render () {
    return (
      <BaseModal>
        <div className={'uk-form-stacked'}>
          <div>
            <h2 className={'nomargin mb-5'}>Create Role</h2>
            <p className='uk-text-muted'>Once created, the role will become editable in the permission editor</p>

            <label>Role Name</label>
            <input
              type='text'
              className={'md-input'}
              name={'name'}
              data-validation='length'
              data-validation-length='min3'
              data-validation-error-msg='Please enter a valid role name. Role name must contain at least 3 characters.'
              value={this.name}
              onChange={e => this.onNameChange(e)}
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Close'} extraClass={'uk-modal-close'} flat={true} waves={true} />
            <Button
              text={'Create'}
              type={'button'}
              flat={true}
              waves={true}
              style={'success'}
              onClick={e => this.onCreateRoleClicked(e)}
            />
          </div>
        </div>
      </BaseModal>
    )
  }
}

CreateRoleModal.propTypes = {
  createRole: PropTypes.func.isRequired
}

export default connect(
  null,
  { createRole }
)(CreateRoleModal)
