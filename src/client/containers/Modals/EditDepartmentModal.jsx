import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { updateDepartment } from 'actions/departments'

import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import $ from 'jquery'
import Button from 'components/Button'
import MultiSelect from 'components/MultiSelect'

function EditDepartmentModal ({
  department,
  teams,
  groups,
  updateDepartment,
  fetchTeams,
  unloadTeams,
  fetchGroups,
  unloadGroups
}) {
  const initialAllGroups = department.get('allGroups')
  const [name, setName] = useState(department.get('name'))
  const [allGroups, setAllGroups] = useState(initialAllGroups)
  const [publicGroups, setPublicGroups] = useState(initialAllGroups ? true : department.get('publicGroups'))
  const teamsSelectRef = useRef(null)
  const groupSelectRef = useRef(null)

  useEffect(() => {
    fetchTeams()
    fetchGroups({ type: 'all' })
    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    helpers.formvalidator()
    return () => {
      unloadTeams()
      unloadGroups()
    }
  }, [])

  useEffect(() => {
    helpers.UI.reRenderInputs()
  })

  useEffect(() => {
    if (!groupSelectRef.current) return
    if (allGroups) groupSelectRef.current.selectAll()
  }, [allGroups])

  const onFormSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const payload = {
      _id: department.get('_id'),
      name,
      teams: teamsSelectRef.current ? teamsSelectRef.current.getSelected() : [],
      allGroups,
      publicGroups,
      groups: allGroups ? [] : (groupSelectRef.current ? groupSelectRef.current.getSelected() : [])
    }

    updateDepartment(payload)
  }

  const departmentTeams = department.get('teams')
  const departmentGroups = department.get('groups')
  const mappedTeams = teams
    .map(team => ({ text: team.get('name'), value: team.get('_id') }))
    .toArray()

  const mappedGroups = groups
    .map(group => ({ text: group.get('name'), value: group.get('_id') }))
    .toArray()

  return (
    <BaseModal options={{ bgclose: false }}>
      <div className={'mb-25'}>
        <h2>Edit Department: {department.get('name')}</h2>
      </div>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
        <div className={'uk-margin-medium-bottom'}>
          <label>Department Name</label>
          <input
            type='text'
            className={'md-input'}
            value={name}
            onChange={e => setName(e.target.value)}
            data-validation='length'
            data-validation-length={'min2'}
            data-validation-error-msg={'Please enter a valid department name. (Must contain 2 characters)'}
          />
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label style={{ marginBottom: 5 }}>Teams</label>
          <MultiSelect
            items={mappedTeams}
            initialSelected={departmentTeams ? departmentTeams.map(d => d.get('_id')).toArray() : []}
            onChange={noop}
            ref={teamsSelectRef}
          />
        </div>
        <hr />
        <div className={'uk-margin-medium-bottom uk-clearfix'}>
          <div className='uk-float-left'>
            <h4 style={{ paddingLeft: 2 }}>Access all current and new customer groups?</h4>
          </div>
          <div className='uk-float-right md-switch md-green' style={{ marginTop: 5 }}>
            <label>
              Yes
              <input
                type='checkbox'
                checked={allGroups}
                onChange={e => {
                  const checked = e.target.checked
                  setAllGroups(checked)
                  setPublicGroups(checked)
                  if (!checked && groupSelectRef.current) groupSelectRef.current.deselectAll()
                }}
              />
              <span className={'lever'} />
            </label>
          </div>
        </div>
        <div className={'uk-margin-medium-bottom uk-clearfix'}>
          <div className='uk-float-left'>
            <h4 style={{ paddingLeft: 2 }}>Access all current and new public groups?</h4>
          </div>
          <div className='uk-float-right md-switch md-green' style={{ marginTop: 1 }}>
            <label>
              Yes
              <input
                type='checkbox'
                checked={publicGroups}
                onChange={e => setPublicGroups(e.target.checked)}
              />
              <span className={'lever'} />
            </label>
          </div>
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label style={{ marginBottom: 5 }}>Customer Groups</label>
          <MultiSelect
            items={mappedGroups}
            onChange={noop}
            initialSelected={departmentGroups ? departmentGroups.map(d => d.get('_id')).toArray() : []}
            ref={groupSelectRef}
            disabled={allGroups}
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Save Department'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

EditDepartmentModal.propTypes = {
  department: PropTypes.object.isRequired,
  updateDepartment: PropTypes.func.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  teams: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  teams: state.teamsState.teams,
  groups: state.groupsState.groups
})

export default connect(mapStateToProps, { updateDepartment, fetchTeams, unloadTeams, fetchGroups, unloadGroups })(
  EditDepartmentModal
)
