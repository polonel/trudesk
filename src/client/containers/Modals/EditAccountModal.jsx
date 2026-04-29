import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'
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

function EditAccountModal ({
  edit,
  user,
  groups,
  teams,
  departments,
  roles,
  saveEditAccount,
  fetchGroups,
  unloadGroups,
  fetchTeams,
  unloadTeams,
  fetchDepartments,
  unloadDepartments,
  fetchRoles
}) {
  const [name, setName] = useState(user.fullname)
  const [title, setTitle] = useState(user.title)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState(user.email)
  const [isAgentRole, setIsAgentRole] = useState(user.role.isAdmin || user.role.isAgent)
  const [selectedRole, setSelectedRole] = useState('')
  const uploadImageInputRef = useRef(null)
  const uploadProfileImageRef = useRef(null)
  const groupSelectRef = useRef(null)
  const teamsSelectRef = useRef(null)

  useEffect(() => {
    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    fetchGroups({ type: 'all' })
    fetchTeams()
    fetchDepartments()
    fetchRoles()
    return () => {
      unloadGroups()
      unloadTeams()
      unloadDepartments()
    }
  }, [])

  useEffect(() => {
    helpers.UI.reRenderInputs()
  })

  const onFileBtnClick = e => {
    e.stopPropagation()
    if (uploadImageInputRef.current) uploadImageInputRef.current.click()
  }

  const onImageUploadChanged = e => {
    const formData = new FormData()
    formData.append('username', user.username)
    formData.append('_id', user._id)
    formData.append('image', e.target.files[0])

    axios
      .post('/accounts/uploadImage', formData)
      .then(res => {
        const timestamp = new Date().getTime()
        if (uploadProfileImageRef.current)
          uploadProfileImageRef.current.setAttribute('src', `${res.data}?${timestamp}`)
      })
      .catch(err => Log.error(err))
  }

  const onRoleSelectChange = e => {
    const roleId = e.target.value
    setSelectedRole(roleId)
    const roleObject = roles.find(role => role.get('_id') === roleId)
    setIsAgentRole(roleObject.get('isAdmin') || roleObject.get('isAgent'))
  }

  const onSubmitSaveAccount = e => {
    e.preventDefault()
    if (!edit) return
    const data = {
      username: user.username,
      fullname: name,
      title,
      email,
      groups: !isAgentRole && groupSelectRef.current ? groupSelectRef.current.getSelected() : undefined,
      teams: isAgentRole && teamsSelectRef.current ? teamsSelectRef.current.getSelected() : undefined,
      role: selectedRole,
      password: password.length > 0 ? password : undefined,
      passwordConfirm: confirmPassword.length > 0 ? confirmPassword : undefined
    }

    saveEditAccount(data)
  }

  const customer = !isAgentRole
  const profilePicture = user.image || 'defaultProfile.jpg'
  const parsedRoles = helpers.getRolesByHierarchy()
  const mappedRoles = parsedRoles.map(role => ({ text: role.name, value: role._id }))

  const mappedTeams = teams
    ? teams.map(team => ({ text: team.get('name'), value: team.get('_id') })).toArray()
    : []

  const mappedDepartments = departments
    ? departments.map(department => ({ text: department.get('name'), value: department.get('_id') })).toArray()
    : []

  const mappedGroups = groups
    ? groups.map(group => ({ text: group.get('name'), value: group.get('_id') })).toArray()
    : []

  const userTeams = user.teams || []
  const userDepartments = user.departments || []
  const userGroups = user.groups || []

  return (
    <BaseModal parentExtraClass={'pt-0'} extraClass={'p-0 pb-25'} options={{ bgclose: false }}>
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
                    ref={uploadImageInputRef}
                    onChange={onImageUploadChanged}
                  />
                  <img
                    src={`/uploads/users/${profilePicture}`}
                    alt='Profile Picture'
                    ref={uploadProfileImageRef}
                  />
                </div>
                <div className='profile-picture-controls'>
                  <span className='btn-file' onClick={onFileBtnClick}>
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
                  ref={uploadProfileImageRef}
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
        <form className='uk-form-stacked' onSubmit={onSubmitSaveAccount}>
          <div className='uk-margin-medium-bottom uk-clearfix'>
            <div className='uk-float-left' style={{ width: '50%', paddingRight: '20px' }}>
              <label className={'uk-form-label'}>Name</label>
              <input
                type='text'
                className={'md-input'}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!edit}
              />
            </div>
            <div className='uk-float-left uk-width-1-2'>
              <label className={'uk-form-label'}>Title</label>
              <input
                type='text'
                className={'md-input'}
                value={title}
                onChange={e => setTitle(e.target.value)}
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
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className='uk-float-left uk-width-1-2'>
                  <label className={'uk-form-label'}>Confirm Password</label>
                  <input
                    type='password'
                    className={'md-input'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
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
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!edit}
            />
          </div>
          {edit && (
            <div className='uk-margin-medium-bottom'>
              <label className={'uk-form-label'}>Role</label>
              <SingleSelect
                items={mappedRoles}
                width={'100'}
                showTextbox={false}
                defaultValue={user.role._id}
                onSelectChange={onRoleSelectChange}
                disabled={!edit}
              />
            </div>
          )}
          {groups && customer && (
            <div className='uk-margin-medium-bottom'>
              <label className='uk-form-label'>Groups</label>
              <MultiSelect
                items={mappedGroups}
                initialSelected={userGroups.map(i => i._id)}
                onChange={noop}
                ref={groupSelectRef}
                disabled={!edit}
              />
            </div>
          )}
          {!customer && (
            <div>
              <div className='uk-margin-medium-bottom'>
                <label className='uk-form-label'>Teams</label>
                <MultiSelect
                  items={mappedTeams}
                  initialSelected={userTeams.map(i => i._id)}
                  onChange={noop}
                  ref={teamsSelectRef}
                  disabled={!edit}
                />
              </div>

              <div className='uk-margin-medium-bottom'>
                <label className='uk-form-label'>Departments</label>
                <MultiSelect
                  items={mappedDepartments}
                  initialSelected={userDepartments.map(i => i._id)}
                  onChange={noop}
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

export default connect(mapStateToProps, {
  saveEditAccount,
  fetchGroups,
  unloadGroups,
  fetchTeams,
  unloadTeams,
  fetchDepartments,
  unloadDepartments,
  fetchRoles
})(EditAccountModal)
