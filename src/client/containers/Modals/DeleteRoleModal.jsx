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
 *  Updated:    2/16/19 5:49 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import { deleteRole } from 'actions/settings'

import BaseModal from './BaseModal'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'

@observer
class DeleteRoleModal extends React.Component {
  @observable selectedRole = ''

  onSelectChanged (e) {
    this.selectedRole = e.target.value
  }

  onFormSubmit (e) {
    e.preventDefault()

    this.props.deleteRole({ _id: this.props.role.get('_id'), newRoleId: this.selectedRole })
  }

  render () {
    const { role } = this.props
    const mappedRoles = this.props.shared.roles
      .filter(obj => {
        return obj.get('_id') !== role.get('_id')
      })
      .map(r => {
        return { text: r.get('name'), value: r.get('_id') }
      })
      .toArray()
    return (
      <BaseModal {...this.props} options={{ bgclose: false }}>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <h2>Remove Role</h2>
            <span>Please select the role you wish to assign ALL users to</span>
            {/*<hr style={{ margin: '10px 0' }} />*/}
          </div>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <div className='uk-float-left' style={{ width: '100%' }}>
              <label className={'uk-form-label nopadding nomargin'}>Type</label>
              <SingleSelect
                showTextbox={false}
                items={mappedRoles}
                onSelectChange={e => this.onSelectChanged(e)}
                value={this.selectedRole}
              />
            </div>
          </div>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <span className='uk-text-danger'>
              WARNING: This will change all accounts with role <strong>{role.get('name')}</strong> to the selected role
              above.
              {role.get('isAdmin') && (
                <span className={'uk-text-danger'}>
                  The role you are about to remove is an admin role. Please ensure there is another Admin role or you
                  could be locked out!
                </span>
              )}
              <br />
              <br />
              <strong style={{ fontSize: '18px' }}>This is permanent!</strong>
            </span>
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Cancel'} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={'Delete'} style={'danger'} flat={true} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

DeleteRoleModal.propTypes = {
  role: PropTypes.object,
  deleteRole: PropTypes.func.isRequired,
  shared: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  shared: state.shared
})

export default connect(
  mapStateToProps,
  { deleteRole }
)(DeleteRoleModal)
