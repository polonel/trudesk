import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { each } from 'lodash'
import { connect } from 'react-redux'
import { hideModal } from 'actions/common'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { getTagsWithPage, fetchTicketTypes } from 'actions/tickets'

import BaseModal from 'containers/Modals/BaseModal'
import SingleSelect from 'components/SingleSelect'
import Button from 'components/Button'

import helpers from 'lib/helpers'

function FilterTicketsModal ({
  groupsState,
  accountsState,
  ticketTags,
  ticketTypes,
  hideModal,
  fetchGroups,
  unloadGroups,
  fetchAccounts,
  unloadAccounts,
  getTagsWithPage,
  fetchTicketTypes
}) {
  const statusSelectRef = useRef(null)
  const tagsSelectRef = useRef(null)
  const typesSelectRef = useRef(null)
  const assigneeSelectRef = useRef(null)
  const groupSelectRef = useRef(null)

  useEffect(() => {
    helpers.UI.inputs()
    fetchGroups()
    fetchAccounts({ page: 0, limit: -1, type: 'agents', showDeleted: false })
    getTagsWithPage({ limit: -1 })
    fetchTicketTypes()
    return () => {
      unloadGroups()
      unloadAccounts()
    }
  }, [])

  useEffect(() => {
    helpers.UI.reRenderInputs()
  })

  const onSubmit = e => {
    e.preventDefault()
    const startDate = e.target.filterDate_Start.value
    const endDate = e.target.filterDate_End.value
    const subject = e.target.subject.value
    const statuses = statusSelectRef.current ? statusSelectRef.current.value : []
    const tags = tagsSelectRef.current ? tagsSelectRef.current.value : []
    const types = typesSelectRef.current ? typesSelectRef.current.value : []
    const groups = groupSelectRef.current ? groupSelectRef.current.value : []
    const assignees = assigneeSelectRef.current ? assigneeSelectRef.current.value : []

    let queryString = '?f=1'
    if (startDate) queryString += `&ds=${startDate}`
    if (endDate) queryString += `&de=${endDate}`

    if (subject) queryString += `&fs=${subject}`

    each(statuses, i => {
      queryString += `&st=${i}`
    })

    each(types, i => {
      queryString += `&tt=${i}`
    })

    each(tags, i => {
      queryString += `&tag=${i}`
    })

    each(groups, i => {
      queryString += `&gp=${i}`
    })

    each(assignees, i => {
      queryString += `&au=${i}`
    })

    History.pushState(null, null, `/tickets/filter/${queryString}&r=${Math.floor(Math.random() * (99999 - 1 + 1)) + 1}`)
    hideModal()
  }

  const statuses = [
    { text: 'New', value: '0' },
    { text: 'Open', value: '1' },
    { text: 'Pending', value: '2' },
    { text: 'Closed', value: '3' }
  ]

  const tags = ticketTags
    .map(t => ({ text: t.get('name'), value: t.get('_id') }))
    .toArray()

  const types = ticketTypes
    .map(t => ({ text: t.get('name'), value: t.get('_id') }))
    .toArray()

  const groups = groupsState.groups
    .map(g => ({ text: g.get('name'), value: g.get('_id') }))
    .toArray()

  const assignees = accountsState.accounts
    .map(a => ({ text: a.get('fullname'), value: a.get('_id') }))
    .toArray()

  return (
    <BaseModal options={{ bgclose: false }}>
      <h2 style={{ marginBottom: 20 }}>Ticket Filter</h2>
      <form className={'uk-form-stacked'} onSubmit={onSubmit}>
        <div className='uk-margin-medium-bottom'>
          <label>Subject</label>
          <input type='text' name={'subject'} className={'md-input'} />
        </div>
        <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
          <div className='uk-width-1-2' style={{ padding: '0 15px 0 0' }}>
            <label htmlFor='filterDate_Start' className='uk-form-label nopadding nomargin'>
              Date Start
            </label>
            <input
              id='filterDate_Start'
              className='md-input'
              name='filterDate_Start'
              type='text'
              data-uk-datepicker={"{format:'" + helpers.getShortDateFormat() + "'}"}
            />
          </div>
          <div className='uk-width-1-2' style={{ padding: '0 0 0 15px' }}>
            <label htmlFor='filterDate_End' className='uk-form-label nopadding nomargin'>
              Date End
            </label>
            <input
              id='filterDate_End'
              className='md-input'
              name='filterDate_End'
              type='text'
              data-uk-datepicker={"{format:'" + helpers.getShortDateFormat() + "'}"}
            />
          </div>
        </div>
        <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
          <div className='uk-width-1-1'>
            <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
              Status
            </label>
            <SingleSelect items={statuses} showTextbox={false} multiple={true} ref={statusSelectRef} />
          </div>
        </div>
        <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
          <div className='uk-width-1-1'>
            <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
              Ticket Tags
            </label>
            <SingleSelect items={tags} showTextbox={true} multiple={true} ref={tagsSelectRef} />
          </div>
        </div>
        <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
          <div className='uk-width-1-1'>
            <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
              Ticket Type
            </label>
            <SingleSelect items={types} showTextbox={false} multiple={true} ref={typesSelectRef} />
          </div>
        </div>
        <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
          <div className='uk-width-1-1'>
            <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
              Assignee
            </label>
            <SingleSelect items={assignees} showTextbox={false} multiple={true} ref={assigneeSelectRef} />
          </div>
        </div>
        <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
          <div className='uk-width-1-1'>
            <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
              Groups
            </label>
            <SingleSelect items={groups} showTextbox={false} multiple={true} ref={groupSelectRef} />
          </div>
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Cancel'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Apply Filter'} style={'primary'} flat={false} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

FilterTicketsModal.propTypes = {
  viewdata: PropTypes.object.isRequired,
  groupsState: PropTypes.object.isRequired,
  accountsState: PropTypes.object.isRequired,
  hideModal: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  getTagsWithPage: PropTypes.func.isRequired,
  ticketTags: PropTypes.object.isRequired,
  fetchTicketTypes: PropTypes.func.isRequired,
  ticketTypes: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  viewdata: state.common.viewdata,
  groupsState: state.groupsState,
  accountsState: state.accountsState,
  ticketTags: state.tagsSettings.tags,
  ticketTypes: state.ticketsState.types
})

export default connect(mapStateToProps, {
  hideModal,
  fetchGroups,
  unloadGroups,
  fetchAccounts,
  unloadAccounts,
  getTagsWithPage,
  fetchTicketTypes
})(FilterTicketsModal)
