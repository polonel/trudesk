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
 *  Updated:    2/10/19 3:06 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable, when } from 'mobx'
import { head, orderBy } from 'lodash'
import axios from 'axios'
import Log from '../../logger'
import { createTicket } from 'actions/tickets'
import { fetchGroups } from 'actions/groups'
import { fetchAccountsCreateTicket } from 'actions/accounts'

import $ from 'jquery'
import helpers from 'lib/helpers'
import socket from 'lib/socket'

import BaseModal from 'containers/Modals/BaseModal'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import SingleSelect from 'components/SingleSelect'
import SpinLoader from 'components/SpinLoader'
import Button from 'components/Button'
import EasyMDE from 'components/EasyMDE'

@observer
class CreateTicketModal extends React.Component {
  @observable priorities = []
  @observable allAccounts = this.props.accounts || []
  @observable groupAccounts = []
  @observable selectedPriority = ''
  issueText = ''

  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.props.fetchGroups()
    this.props.fetchAccountsCreateTicket({ type: 'all', limit: 1000 })
    helpers.UI.inputs()
    helpers.formvalidator()
    this.defaultTicketTypeWatcher = when(
      () => this.props.viewdata.defaultTicketType,
      () => {
        this.priorities = orderBy(this.props.viewdata.defaultTicketType.priorities, ['migrationNum'])
        this.selectedPriority = head(this.priorities) ? head(this.priorities)._id : ''
      }
    )
  }

  componentDidUpdate () {}

  componentWillUnmount () {
    if (this.defaultTicketTypeWatcher) this.defaultTicketTypeWatcher()
  }

  onTicketTypeSelectChange (e) {
    this.priorityWrapper.classList.add('hide')
    this.priorityLoader.classList.remove('hide')
    axios
      .get(`/api/v1/tickets/type/${e.target.value}`)
      .then(res => {
        const type = res.data.type
        if (type && type.priorities) {
          this.priorities = orderBy(type.priorities, ['migrationNum'])
          this.selectedPriority = head(orderBy(type.priorities, ['migrationNum']))
            ? head(orderBy(type.priorities, ['migrationNum']))._id
            : ''

          setTimeout(() => {
            this.priorityLoader.classList.add('hide')
            this.priorityWrapper.classList.remove('hide')
          }, 500)
        }
      })
      .catch(error => {
        this.priorityLoader.classList.add('hide')
        Log.error(error)
        helpers.UI.showSnackbar(`Error: ${error.response.data.error}`)
      })
  }

  onPriorityRadioChange (e) {
    this.selectedPriority = e.target.value
  }

  onFormSubmit (e) {
    e.preventDefault()
    const $form = $(e.target)

    let data = {}
    if (this.issueText.length < 1) return
    const allowAgentUserTickets =
      this.props.viewdata.ticketSettings.allowAgentUserTickets &&
      (this.props.shared.sessionUser.role.isAdmin || this.props.shared.sessionUser.role.isAgent)

    const minIssueLength = this.props.viewdata.ticketSettings.minIssue
    let $mdeError
    const $issueTextbox = $(this.issueMde.element)
    const $errorBorderWrap = $issueTextbox.parents('.error-border-wrap')
    if (this.issueText.length < minIssueLength) {
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

    if (allowAgentUserTickets) data.owner = this.ownerSelect.value

    data.subject = e.target.subject.value
    data.group = this.groupSelect.value
    data.type = this.typeSelect.value
    data.tags = this.tagSelect.value
    data.priority = this.selectedPriority
    data.issue = this.issueMde.easymde.value()
    data.socketid = socket.ui.socket.io.engine.id

    this.props.createTicket(data)
  }

  onGroupSelectChange (e) {
    // this.groupAccounts = this.props.groups
    //   .filter(grp => grp.get('_id') === e.target.value)
    //   .first()
    //   .get('members')
    //   .map(a => {
    //     return { text: a.get('fullname'), value: a.get('_id') }
    //   })
    //   .toArray()
  }

  render () {
    const { shared, viewdata } = this.props

    const allowAgentUserTickets =
      viewdata.ticketSettings.allowAgentUserTickets &&
      (shared.sessionUser.role.isAdmin || shared.sessionUser.role.isAgent)

    const mappedAccounts = this.props.accounts
      .map(a => {
        return { text: a.get('fullname'), value: a.get('_id') }
      })
      .toArray()

    const mappedGroups = this.props.groups
      .map(grp => {
        return { text: grp.get('name'), value: grp.get('_id') }
      })
      .toArray()

    const mappedTicketTypes = this.props.viewdata.ticketTypes.map(type => {
      return { text: type.name, value: type._id }
    })
    const mappedTicketTags = this.props.viewdata.ticketTags.map(tag => {
      return { text: tag.name, value: tag._id }
    })
    return (
      <BaseModal {...this.props} options={{ bgclose: false }}>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className='uk-margin-medium-bottom'>
            <label>Subject</label>
            <input
              type='text'
              name={'subject'}
              className={'md-input'}
              data-validation='length'
              data-validation-length={`min${viewdata.ticketSettings.minSubject}`}
              data-validation-error-msg={`Please enter a valid Subject. Subject must contain at least ${
                viewdata.ticketSettings.minSubject
              } characters.`}
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
                    defaultValue={[this.props.viewdata.loggedInAccount._id]}
                    width={'100%'}
                    ref={i => (this.ownerSelect = i)}
                  />
                </GridItem>
              )}
              <GridItem width={allowAgentUserTickets ? '2-3' : '1-1'}>
                <label className={'uk-form-label'}>Group</label>
                <SingleSelect
                  showTextbox={false}
                  items={mappedGroups}
                  defaultValue={head(mappedGroups) ? head(mappedGroups).value : ''}
                  onSelectChange={e => this.onGroupSelectChange(e)}
                  width={'100%'}
                  ref={i => (this.groupSelect = i)}
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
                  defaultValue={this.props.viewdata.defaultTicketType._id}
                  onSelectChange={e => {
                    this.onTicketTypeSelectChange(e)
                  }}
                  ref={i => (this.typeSelect = i)}
                />
              </GridItem>
              <GridItem width={'2-3'}>
                <label className={'uk-form-label'}>Tags</label>
                <SingleSelect
                  showTextbox={false}
                  items={mappedTicketTags}
                  width={'100%'}
                  multiple={true}
                  ref={i => (this.tagSelect = i)}
                />
              </GridItem>
            </Grid>
          </div>
          <div className='uk-margin-medium-bottom'>
            <label className={'uk-form-label'}>Priority</label>
            <div
              ref={i => (this.priorityLoader = i)}
              style={{ height: '32px', width: '32px', position: 'relative' }}
              className={'hide'}
            >
              <SpinLoader
                style={{ background: 'transparent' }}
                spinnerStyle={{ width: '24px', height: '24px' }}
                active={true}
              />
            </div>
            <div ref={i => (this.priorityWrapper = i)} className={'uk-clearfix'}>
              {this.priorities.map(priority => {
                return (
                  <div key={priority._id} className={'uk-float-left'}>
                    <span className={'icheck-inline'}>
                      <input
                        id={'p___' + priority._id}
                        name={'priority'}
                        type='radio'
                        className={'with-gap'}
                        value={priority._id}
                        onChange={e => {
                          this.onPriorityRadioChange(e)
                        }}
                        checked={this.selectedPriority === priority._id}
                        data-md-icheck
                      />
                      <label htmlFor={'p___' + priority._id} className={'mb-10 inline-label'}>
                        <span className='uk-badge' style={{ backgroundColor: priority.htmlColor }}>
                          {priority.name}
                        </span>
                      </label>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className='uk-margin-medium-bottom'>
            <span>Description</span>
            <div className='error-border-wrap uk-clearfix'>
              <EasyMDE
                ref={i => (this.issueMde = i)}
                onChange={val => (this.issueText = val)}
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
}

CreateTicketModal.propTypes = {
  shared: PropTypes.object.isRequired,
  viewdata: PropTypes.object.isRequired,
  accounts: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired,
  createTicket: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  fetchAccountsCreateTicket: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  shared: state.shared,
  viewdata: state.common,
  groups: state.groupsState.groups,
  accounts: state.accountsState.accountsCreateTicket
})

export default connect(
  mapStateToProps,
  { createTicket, fetchGroups, fetchAccountsCreateTicket }
)(CreateTicketModal)
