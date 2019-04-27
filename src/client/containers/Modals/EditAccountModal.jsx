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
 *  Updated:    2/23/19 4:03 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import axios from 'axios'
import Log from '../../logger'

import { saveEditAccount } from 'actions/accounts'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchDepartments, unloadDepartments } from 'actions/departments'
import { fetchRoles } from 'actions/common'

import Button from 'components/Button'
import BaseModal from 'containers/Modals/BaseModal'
import SingleSelect from 'components/SingleSelect'
import MultiSelect from 'components/MultiSelect'

import helpers from 'lib/helpers'

@observer
class EditAccountModal extends React.Component {
  @observable name = ''
  @observable title = ''
  @observable password = ''
  @observable confirmPassword = ''
  @observable email = ''

  selectedRole = ''
  @observable isAgentRole = false

  componentDidMount () {
    this.name = this.props.user.fullname
    this.title = this.props.user.title
    this.email = this.props.user.email
    this.isAgentRole = this.props.user.role.isAdmin || this.props.user.role.isAgent

    helpers.UI.inputs()
    helpers.UI.reRenderInputs()

    this.props.fetchGroups({ type: 'all' })
    this.props.fetchTeams()
    this.props.fetchDepartments()
    this.props.fetchRoles()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  componentWillUnmount () {
    this.props.unloadGroups()
    this.props.unloadTeams()
    this.props.unloadDepartments()
  }

  onFileBtnClick (e) {
    e.stopPropagation()
    if (this.uploadImageInput) this.uploadImageInput.click()
  }

  onImageUploadChanged (e) {
    const self = e.target
    const that = this
    let formData = new FormData()
    formData.append('username', this.props.user.username)
    formData.append('_id', this.props.user._id)
    formData.append('image', self.files[0])

    axios
      .post('/accounts/uploadImage', formData)
      .then(res => {
        const timestamp = new Date().getTime()
        that.uploadProfileImage.setAttribute('src', `${res.data}?${timestamp}`)
      })
      .catch(err => {
        Log.error(err)
      })
  }

  onInputChanged (e, stateName) {
    this[stateName] = e.target.value
  }

  onRoleSelectChange (e) {
    this.selectedRole = e.target.value

    const roleObject = this.props.roles.find(role => {
      return role.get('_id') === this.selectedRole
    })

    this.isAgentRole = roleObject.get('isAdmin') || roleObject.get('isAgent')
  }

  onSubmitSaveAccount (e) {
    e.preventDefault()
    if (!this.props.edit) return
    const data = {
      username: this.props.user.username,
      fullname: this.name,
      title: this.title,
      email: this.email,
      groups: !this.isAgentRole && this.groupSelect ? this.groupSelect.getSelected() : undefined,
      teams: this.isAgentRole && this.teamsSelect ? this.teamsSelect.getSelected() : undefined,
      role: this.selectedRole,
      password: this.password.length > 1 ? this.password : undefined,
      passwordConfirm: this.confirmPassword.length > 1 ? this.confirmPassword : undefined
    }

    this.props.saveEditAccount(data)
  }

  render () {
    const { user, edit } = this.props
    const customer = !this.isAgentRole
    const profilePicture = user.image || 'defaultProfile.jpg'
    const parsedRoles = helpers.getRolesByHierarchy()
    const roles = parsedRoles.map(role => {
      return { text: role.name, value: role._id }
    })

    let departments, groups, teams

    teams = this.props.teams
      ? this.props.teams
          .map(team => {
            return { text: team.get('name'), value: team.get('_id') }
          })
          .toArray()
      : []

    departments = this.props.departments
      ? this.props.departments
          .map(department => {
            return { text: department.get('name'), value: department.get('_id') }
          })
          .toArray()
      : []

    groups = this.props.groups
      ? this.props.groups
          .map(group => {
            return { text: group.get('name'), value: group.get('_id') }
          })
          .toArray()
      : []

    if (!user.teams) user.teams = []
    if (!user.departments) user.departments = []
    if (!user.groups) user.groups = []

    return (
      <BaseModal parentExtraClass={'pt-0'} extraClass={'p-0 pb-25'}>
        <div className='user-heading' style={{ minHeight: '130px', background: '#1976d2', padding: '24px' }}>
          <div className='uk-width-1-1'>
            <div style={{ width: '82px', height: '82px', float: 'left', marginRight: '24px', position: 'relative' }}>
              {edit && (
                <form className={'form nomargin'} encType={'multipart/form-data'}>
                  <div className='mediumProfilePic' style={{ position: 'relative' }}>
                    <input name={'_id'} type='hidden' value={user._id} readOnly={true} />
                    <input name={'username'} type='hidden' value={user.username} readOnly={true} />
                    <input
                      type='file'
                      style={{ display: 'none' }}
                      ref={r => (this.uploadImageInput = r)}
                      onChange={e => this.onImageUploadChanged(e)}
                    />
                    <img
                      src={`/uploads/users/${profilePicture}`}
                      alt='Profile Picture'
                      ref={r => (this.uploadProfileImage = r)}
                    />
                  </div>
                  <div className='profile-picture-controls'>
                    <span className='btn-file' onClick={e => this.onFileBtnClick(e)}>
                      <i className='material-icons'>file_upload</i>
                    </span>
                  </div>
                </form>
              )}
              {!edit && (
                <div className='mediumProfilePic' style={{ position: 'relative' }}>
                  <img
                    src={`/uploads/users/${profilePicture}`}
                    alt='Profile Picture'
                    ref={r => (this.uploadProfileImage = r)}
                  />
                </div>
              )}
            </div>
            <div className='user-heading-content'>
              <h2>
                <span className={'uk-text-truncate'}>{user.username}</span>
                <span className='sub-heading'>{user.title}</span>
              </h2>
            </div>
          </div>
        </div>
        <div style={{ margin: '24px 24px 0 24px' }}>
          <form className='uk-form-stacked' onSubmit={e => this.onSubmitSaveAccount(e)}>
            <div className='uk-margin-medium-bottom uk-clearfix'>
              <div className='uk-float-left' style={{ width: '50%', paddingRight: '20px' }}>
                <label className={'uk-form-label'}>Name</label>
                <input
                  type='text'
                  className={'md-input'}
                  value={this.name}
                  onChange={e => this.onInputChanged(e, 'name')}
                  disabled={!edit}
                />
              </div>
              <div className='uk-float-left uk-width-1-2'>
                <label className={'uk-form-label'}>Title</label>
                <input
                  type='text'
                  className={'md-input'}
                  value={this.title}
                  onChange={e => this.onInputChanged(e, 'title')}
                  disabled={!edit}
                />
              </div>
            </div>
            {edit && (
              <div>
                <div className='uk-margin-medium-bottom uk-clearfix'>
                  <div className='uk-float-left' style={{ width: '50%', paddingRight: '20px' }}>
                    <label className={'uk-form-label'}>Password</label>
                    <input
                      type='password'
                      className={'md-input'}
                      value={this.password}
                      onChange={e => this.onInputChanged(e, 'password')}
                    />
                  </div>
                  <div className='uk-float-left uk-width-1-2'>
                    <label className={'uk-form-label'}>Confirm Password</label>
                    <input
                      type='password'
                      className={'md-input'}
                      value={this.confirmPassword}
                      onChange={e => this.onInputChanged(e, 'confirmPassword')}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className='uk-margin-medium-bottom'>
              <label className='uk-form-label'>Email</label>
              <input
                type='email'
                className={'md-input'}
                value={this.email}
                onChange={e => this.onInputChanged(e, 'email')}
                disabled={!edit}
              />
            </div>
            {edit && (
              <div className='uk-margin-medium-bottom'>
                <label className={'uk-form-label'}>Role</label>
                <SingleSelect
                  items={roles}
                  width={'100'}
                  showTextbox={false}
                  defaultValue={user.role._id}
                  onSelectChange={e => this.onRoleSelectChange(e)}
                  disabled={!edit}
                />
              </div>
            )}
            {this.props.groups && customer && (
              <div className='uk-margin-medium-bottom'>
                <label className='uk-form-label'>Groups</label>
                <MultiSelect
                  items={groups}
                  initialSelected={user.groups.map(i => i._id)}
                  onChange={() => {}}
                  ref={r => (this.groupSelect = r)}
                  disabled={!edit}
                />
              </div>
            )}
            {!customer && (
              <div>
                <div className='uk-margin-medium-bottom'>
                  <label className='uk-form-label'>Teams</label>
                  <MultiSelect
                    items={teams}
                    initialSelected={user.teams.map(i => i._id)}
                    onChange={() => {}}
                    ref={r => (this.teamsSelect = r)}
                    disabled={!edit}
                  />
                </div>

                <div className='uk-margin-medium-bottom'>
                  <label className='uk-form-label'>Departments</label>
                  <MultiSelect
                    items={departments}
                    initialSelected={user.departments.map(i => i._id)}
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
            )}
            <div className='uk-modal-footer uk-text-right'>
              <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
              <Button
                text={'Save Account'}
                flat={true}
                waves={true}
                style={'primary'}
                type={'submit'}
                disabled={!edit}
              />
            </div>
          </form>
        </div>
      </BaseModal>
    )
  }
}

EditAccountModal.propTypes = {
  edit: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired,
  teams: PropTypes.object.isRequired,
  departments: PropTypes.object.isRequired,
  saveEditAccount: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  fetchDepartments: PropTypes.func.isRequired,
  unloadDepartments: PropTypes.func.isRequired,
  fetchRoles: PropTypes.func.isRequired,
  roles: PropTypes.object.isRequired
}

EditAccountModal.defaultProps = {
  edit: false
}

const mapStateToProps = state => ({
  groups: state.groupsState.groups,
  teams: state.teamsState.teams,
  departments: state.departmentsState.departments,
  roles: state.shared.roles
})

export default connect(
  mapStateToProps,
  {
    saveEditAccount,
    fetchGroups,
    unloadGroups,
    fetchTeams,
    unloadTeams,
    fetchDepartments,
    unloadDepartments,
    fetchRoles
  }
)(EditAccountModal)
