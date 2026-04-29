import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import noop from 'lodash/noop'

import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { createDepartment } from 'actions/departments'

import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import $ from 'jquery'
import Button from 'components/Button'
import MultiSelect from 'components/MultiSelect'

function CreateDepartmentModal ({ teams, groups, createDepartment, fetchTeams, unloadTeams, fetchGroups, unloadGroups }) {
  const [name, setName] = useState('')
  const [allGroups, setAllGroups] = useState(false)
  const [publicGroups, setPublicGroups] = useState(false)
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
    else groupSelectRef.current.deselectAll()
  }, [allGroups])

  const onFormSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    if (!allGroups && !publicGroups && groupSelectRef.current && groupSelectRef.current.getSelected() == null) {
      helpers.UI.showSnackbar('Can not create department without a group selected or all groups enabled!', true)
      return false
    }

    if (teamsSelectRef.current && teamsSelectRef.current.getSelected() == null) {
      helpers.UI.showSnackbar('Can not create department without a team selected!', true)
      return false
    }

    const payload = {
      name,
      teams: teamsSelectRef.current ? teamsSelectRef.current.getSelected() : [],
      allGroups,
      publicGroups,
      groups: allGroups ? [] : (groupSelectRef.current ? groupSelectRef.current.getSelected() : [])
    }

    createDepartment(payload)
  }

  const mappedTeams = teams
    .map(team => ({ text: team.get('name'), value: team.get('_id') }))
    .toArray()

  const mappedGroups = groups
    .map(group => ({ text: group.get('name'), value: group.get('_id') }))
    .toArray()

  return (
    <BaseModal options={{ bgclose: false }}>
      <div className={'mb-25'}>
        <h2>Create Department</h2>
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
          <MultiSelect items={mappedTeams} onChange={noop} ref={teamsSelectRef} />
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
                value={allGroups}
                onChange={e => setAllGroups(e.target.checked)}
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
            ref={groupSelectRef}
            disabled={allGroups}
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Create Department'} flat={true} waves={true} style={'primary'} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateDepartmentModal.propTypes = {
  createDepartment: PropTypes.func.isRequired,
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

export default connect(mapStateToProps, { createDepartment, fetchTeams, unloadTeams, fetchGroups, unloadGroups })(
  CreateDepartmentModal
)
