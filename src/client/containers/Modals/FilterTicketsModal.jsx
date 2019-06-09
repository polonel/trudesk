/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    5/18/19 1:19 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { each } from 'lodash'
import { connect } from 'react-redux'
import { hideModal } from 'actions/common'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { fetchAccounts, unloadAccounts } from 'actions/accounts'

import BaseModal from 'containers/Modals/BaseModal'
import SingleSelect from 'components/SingleSelect'
import Button from 'components/Button'

import helpers from 'lib/helpers'

class FilterTicketsModal extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    helpers.UI.inputs()
    this.props.fetchGroups()
    this.props.fetchAccounts({ page: 0, limit: -1, type: 'agents', showDeleted: false })
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  componentWillUnmount () {
    this.props.unloadGroups()
    this.props.unloadAccounts()
  }

  onSubmit (e) {
    e.preventDefault()
    const startDate = e.target.filterDate_Start.value
    const endDate = e.target.filterDate_End.value
    const subject = e.target.subject.value
    const statuses = this.statusSelect.value
    const tags = this.tagsSelect.value
    const types = this.typesSelect.value
    const groups = this.groupSelect.value
    const assignees = this.assigneeSelect.value

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
    this.props.hideModal()
  }

  render () {
    const statuses = [
      { text: 'New', value: '0' },
      { text: 'Open', value: '1' },
      { text: 'Pending', value: '2' },
      { text: 'Closed', value: '3' }
    ]

    const tags = this.props.common.ticketTags.map(t => {
      return { text: t.name, value: t._id }
    })

    const types = this.props.common.ticketTypes.map(t => {
      return { text: t.name, value: t._id }
    })

    const groups = this.props.groupsState.groups
      .map(g => {
        return { text: g.get('name'), value: g.get('_id') }
      })
      .toArray()

    const assignees = this.props.accountsState.accounts
      .map(a => {
        return { text: a.get('fullname'), value: a.get('_id') }
      })
      .toArray()

    return (
      <BaseModal options={{ bgclose: false }}>
        <h2 style={{ marginBottom: 20 }}>Ticket Filter</h2>
        <form className={'uk-form-stacked'} onSubmit={e => this.onSubmit(e)}>
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
              <SingleSelect items={statuses} showTextbox={false} multiple={true} ref={r => (this.statusSelect = r)} />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Ticket Tags
              </label>
              <SingleSelect items={tags} showTextbox={true} multiple={true} ref={r => (this.tagsSelect = r)} />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Ticket Type
              </label>
              <SingleSelect items={types} showTextbox={false} multiple={true} ref={r => (this.typesSelect = r)} />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Assignee
              </label>
              <SingleSelect
                items={assignees}
                showTextbox={false}
                multiple={true}
                ref={r => (this.assigneeSelect = r)}
              />
            </div>
          </div>
          <div className='uk-grid uk-grid-collapse uk-margin-small-bottom'>
            <div className='uk-width-1-1'>
              <label htmlFor='filterStatus' className='uk-form-label' style={{ paddingBottom: 0, marginBottom: 0 }}>
                Groups
              </label>
              <SingleSelect items={groups} showTextbox={false} multiple={true} ref={r => (this.groupSelect = r)} />
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
}

FilterTicketsModal.propTypes = {
  common: PropTypes.object.isRequired,
  groupsState: PropTypes.object.isRequired,
  accountsState: PropTypes.object.isRequired,
  hideModal: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  common: state.common,
  groupsState: state.groupsState,
  accountsState: state.accountsState
})

export default connect(
  mapStateToProps,
  { hideModal, fetchGroups, unloadGroups, fetchAccounts, unloadAccounts }
)(FilterTicketsModal)
