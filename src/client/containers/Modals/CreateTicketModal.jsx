import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { head, orderBy } from 'lodash'
import axios from 'axios'
import Log from '../../logger'
import { createTicket, fetchTicketTypes, getTagsWithPage } from 'actions/tickets'
import { fetchGroups } from 'actions/groups'
import { fetchAccountsCreateTicket } from 'actions/accounts'

import $ from 'jquery'
import helpers from 'lib/helpers'

import BaseModal from 'containers/Modals/BaseModal'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import SingleSelect from 'components/SingleSelect'
import SpinLoader from 'components/SpinLoader'
import Button from 'components/Button'
import EasyMDE from 'components/EasyMDE'

function CreateTicketModal ({
  shared,
  socket,
  viewdata,
  ticketTypes,
  ticketTags,
  accounts,
  groups,
  createTicket,
  fetchTicketTypes,
  getTagsWithPage,
  fetchGroups,
  fetchAccountsCreateTicket
}) {
  const defaultType = viewdata.get('defaultTicketType')
  const initialPriorities = defaultType
    ? orderBy(defaultType.toJS().priorities, ['migrationNum'])
    : []

  const [priorities, setPriorities] = useState(initialPriorities)
  const [selectedPriority, setSelectedPriority] = useState(head(initialPriorities)?._id ?? '')
  const issueTextRef = useRef('')
  const priorityLoaderRef = useRef(null)
  const priorityWrapperRef = useRef(null)
  const ownerSelectRef = useRef(null)
  const groupSelectRef = useRef(null)
  const typeSelectRef = useRef(null)
  const tagSelectRef = useRef(null)
  const issueMdeRef = useRef(null)

  useEffect(() => {
    fetchTicketTypes()
    getTagsWithPage({ limit: -1 })
    fetchGroups()
    fetchAccountsCreateTicket({ type: 'all', limit: 1000 })
    helpers.UI.inputs()
    helpers.formvalidator()
  }, [])

  useEffect(() => {
    if (!defaultType) return
    const sorted = orderBy(defaultType.toJS().priorities, ['migrationNum'])
    setPriorities(sorted)
    setSelectedPriority(head(sorted)?._id ?? '')
  }, [defaultType])

  const onTicketTypeSelectChange = e => {
    priorityWrapperRef.current?.classList.add('hide')
    priorityLoaderRef.current?.classList.remove('hide')
    axios
      .get(`/api/v1/tickets/type/${e.target.value}`)
      .then(res => {
        const type = res.data.type
        if (type && type.priorities) {
          const sorted = orderBy(type.priorities, ['migrationNum'])
          setPriorities(sorted)
          setSelectedPriority(head(sorted)?._id ?? '')

          setTimeout(() => {
            priorityLoaderRef.current?.classList.add('hide')
            priorityWrapperRef.current?.classList.remove('hide')
          }, 500)
        }
      })
      .catch(error => {
        priorityLoaderRef.current?.classList.add('hide')
        Log.error(error)
        helpers.UI.showSnackbar(`Error: ${error.response.data.error}`)
      })
  }

  const onFormSubmit = e => {
    e.preventDefault()
    const $form = $(e.target)

    if (issueTextRef.current.length < 1) return

    const allowAgentUserTickets =
      viewdata.get('ticketSettings').get('allowAgentUserTickets') &&
      (shared.sessionUser.role.isAdmin || shared.sessionUser.role.isAgent)

    const minIssueLength = viewdata.get('ticketSettings').get('minIssue')
    let $mdeError
    const $issueTextbox = $(issueMdeRef.current.element)
    const $errorBorderWrap = $issueTextbox.parents('.error-border-wrap')
    if (issueTextRef.current.length < minIssueLength) {
      $errorBorderWrap.css({ border: '1px solid #E74C3C' })
      const mdeError = $(
        `<div class="mde-error uk-float-left uk-text-left">Please enter a valid issue. Issue must contain at least ${minIssueLength} characters</div>`
      )
      $mdeError = $issueTextbox.siblings('.editor-statusbar').find('.mde-error')
      if ($mdeError.length < 1) $issueTextbox.siblings('.editor-statusbar').prepend(mdeError)
      return
    }

    $errorBorderWrap.css('border', 'none')
    $mdeError = $issueTextbox.parent().find('.mde-error')
    if ($mdeError.length > 0) $mdeError.remove()

    if (!$form.isValid(null, null, false)) return true

    const data = {}
    if (allowAgentUserTickets) data.owner = ownerSelectRef.current.value

    data.subject = e.target.subject.value
    data.group = groupSelectRef.current.value
    data.type = typeSelectRef.current.value
    data.tags = tagSelectRef.current.value
    data.priority = selectedPriority
    data.issue = issueMdeRef.current.easymde.value()
    data.socketid = socket.io.engine.id

    createTicket(data)
  }

  const allowAgentUserTickets =
    viewdata.get('ticketSettings').get('allowAgentUserTickets') &&
    (shared.sessionUser.role.isAdmin || shared.sessionUser.role.isAgent)

  const mappedAccounts = accounts
    .map(a => ({ text: a.get('fullname'), value: a.get('_id') }))
    .toArray()

  const mappedGroups = groups
    .map(grp => ({ text: grp.get('name'), value: grp.get('_id') }))
    .toArray()

  const mappedTicketTypes = ticketTypes.toArray().map(type => ({
    text: type.get('name'),
    value: type.get('_id')
  }))

  const mappedTicketTags = ticketTags.toArray().map(tag => ({
    text: tag.get('name'),
    value: tag.get('_id')
  }))

  return (
    <BaseModal options={{ bgclose: false }}>
      <form className={'uk-form-stacked'} onSubmit={onFormSubmit}>
        <div className='uk-margin-medium-bottom'>
          <label>Subject</label>
          <input
            type='text'
            name={'subject'}
            className={'md-input'}
            data-validation='length'
            data-validation-length={`min${viewdata.get('ticketSettings').get('minSubject')}`}
            data-validation-error-msg={`Please enter a valid Subject. Subject must contain at least ${viewdata
              .get('ticketSettings')
              .get('minSubject')} characters.`}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <Grid>
            {allowAgentUserTickets && (
              <GridItem width={'1-3'}>
                <label className={'uk-form-label'}>Owner</label>
                <SingleSelect
                  showTextbox={true}
                  items={mappedAccounts}
                  defaultValue={shared.sessionUser._id}
                  width={'100%'}
                  ref={ownerSelectRef}
                />
              </GridItem>
            )}
            <GridItem width={allowAgentUserTickets ? '2-3' : '1-1'}>
              <label className={'uk-form-label'}>Group</label>
              <SingleSelect
                showTextbox={false}
                items={mappedGroups}
                defaultValue={head(mappedGroups) ? head(mappedGroups).value : ''}
                width={'100%'}
                ref={groupSelectRef}
              />
            </GridItem>
          </Grid>
        </div>
        <div className='uk-margin-medium-bottom'>
          <Grid>
            <GridItem width={'1-3'}>
              <label className={'uk-form-label'}>Type</label>
              <SingleSelect
                showTextbox={false}
                items={mappedTicketTypes}
                width={'100%'}
                defaultValue={viewdata.get('defaultTicketType').get('_id')}
                onSelectChange={onTicketTypeSelectChange}
                ref={typeSelectRef}
              />
            </GridItem>
            <GridItem width={'2-3'}>
              <label className={'uk-form-label'}>Tags</label>
              <SingleSelect
                showTextbox={false}
                items={mappedTicketTags}
                width={'100%'}
                multiple={true}
                ref={tagSelectRef}
              />
            </GridItem>
          </Grid>
        </div>
        <div className='uk-margin-medium-bottom'>
          <label className={'uk-form-label'}>Priority</label>
          <div
            ref={priorityLoaderRef}
            style={{ height: '32px', width: '32px', position: 'relative' }}
            className={'hide'}
          >
            <SpinLoader
              style={{ background: 'transparent' }}
              spinnerStyle={{ width: '24px', height: '24px' }}
              active={true}
            />
          </div>
          <div ref={priorityWrapperRef} className={'uk-clearfix'}>
            {priorities.map(priority => (
              <div key={priority._id} className={'uk-float-left'}>
                <span className={'icheck-inline'}>
                  <input
                    id={'p___' + priority._id}
                    name={'priority'}
                    type='radio'
                    className={'with-gap'}
                    value={priority._id}
                    onChange={e => setSelectedPriority(e.target.value)}
                    checked={selectedPriority === priority._id}
                    data-md-icheck
                  />
                  <label htmlFor={'p___' + priority._id} className={'mb-10 inline-label'}>
                    <span className='uk-badge' style={{ backgroundColor: priority.htmlColor }}>
                      {priority.name}
                    </span>
                  </label>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className='uk-margin-medium-bottom'>
          <span>Description</span>
          <div className='error-border-wrap uk-clearfix'>
            <EasyMDE
              ref={issueMdeRef}
              onChange={val => { issueTextRef.current = val }}
              allowImageUpload={true}
              inlineImageUploadUrl={'/tickets/uploadmdeimage'}
              inlineImageUploadHeaders={{ ticketid: 'uploads' }}
            />
          </div>
          <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }} className={'uk-text-muted'}>
            Please try to be as specific as possible. Please include any details you think may be relevant, such as
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            troubleshooting steps you've taken.
          </span>
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Cancel'} flat={true} waves={true} extraClass={'uk-modal-close'} />
          <Button text={'Create'} style={'primary'} flat={true} type={'submit'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateTicketModal.propTypes = {
  shared: PropTypes.object.isRequired,
  socket: PropTypes.object.isRequired,
  viewdata: PropTypes.object.isRequired,
  ticketTypes: PropTypes.object.isRequired,
  ticketTags: PropTypes.object.isRequired,
  accounts: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired,
  createTicket: PropTypes.func.isRequired,
  fetchTicketTypes: PropTypes.func.isRequired,
  getTagsWithPage: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  fetchAccountsCreateTicket: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  shared: state.shared,
  socket: state.shared.socket,
  viewdata: state.common.viewdata,
  ticketTypes: state.ticketsState.types,
  ticketTags: state.tagsSettings.tags,
  groups: state.groupsState.groups,
  accounts: state.accountsState.accountsCreateTicket
})

export default connect(mapStateToProps, {
  createTicket,
  fetchTicketTypes,
  getTagsWithPage,
  fetchGroups,
  fetchAccountsCreateTicket
})(CreateTicketModal)
