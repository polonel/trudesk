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
 *  Updated:    4/12/19 12:20 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import mongoose from 'mongoose'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { makeObservable, observable } from 'mobx'
import { observer } from 'mobx-react'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { updateGroup } from 'actions/groups'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'

import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'

@observer
class EditGroupModal extends React.Component {
  @observable name = ''
  @observable domainName = ''
  @observable phone = ''
  @observable site = ''
  @observable address = ''
  
  constructor (props) {
    super(props)
    makeObservable(this)
  }

//Валидация номера телефона
  _validatePhone (phone) {
    if (!phone) return false
    return phone
      .toString()
      .toLowerCase()
      .match(
        /^\+\d+$/
      )
  }

//Валидация сайта
  _validateSite (site) {
    if (!site) return false
    return site
      .toString()
      .toLowerCase()
      .match(
        /(^https?:\/\/)?[a-z0-9~_\-\.]+\.[a-z]{2,9}(\/|:|\?[!-~]*)?$/i
      )
  }

  componentDidMount () {
    this.props.fetchAccounts({ type: 'customers', limit: -1 })
    this.name = this.props.group.name
    this.domainName = this.props.group.domainName
    this.phone = this.props.group.phone
    this.site = this.props.group.site
    this.address = this.props.group.address
    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    helpers.formvalidator()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  componentWillUnmount () {
    this.props.unloadAccounts()
  }

  onFormSubmit (e) {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    if (!this._validatePhone(this.phone)) {
      helpers.UI.showSnackbar('Invalid Phone Number', true)
      return
    }

    if (!this._validateSite(this.site)) {
      helpers.UI.showSnackbar('Invalid Website', true)
      return
    }

    const payload = {
      _id: this.props.group._id,
      name: this.name,
      domainName: this.domainName,
      members: this.membersSelect.getSelected() || [],
      sendMailTo: this.sendMailToSelect.getSelected() || [],
      phone: this.phone,
      site: this.site,
      address: this.address
    }

    this.props.updateGroup(payload)
  }

  onInputChange (e) {
    this.name = e.target.value
  }

  onInputChangeDomain (e) {
    this.domainName = e.target.value
  }

  onInputChangePhone (e) {
    this.phone = e.target.value
  }

  onInputChangeSite (e) {
    this.site = e.target.value
  }

  onInputChangeAddress (e) {
    this.address = e.target.value
  }

  render () {
    const mappedAccounts = this.props.accounts
      .map(account => {
        return { text: account.get('fullname'), value: account.get('_id') }
      })
      .toArray()

    const selectedMembers = this.props.group.members.map(member => {
      return member._id
    })
    const selectedSendMailTo = this.props.group.sendMailTo.map(member => {
      return member._id
    })
    return (
      <BaseModal>
        <SpinLoader active={this.props.accountsLoading} />
        <div className={'mb-25'}>
          <h2>Edit Group</h2>
        </div>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className={'uk-margin-medium-bottom'}>
            <label>Group Name</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name}
              onChange={e => this.onInputChange(e)}
              data-validation='length'
              data-validation-length={'min2'}
              data-validation-error-msg={'Please enter a valid Group name. (Must contain 2 characters)'}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label>Domain Name</label>
            <input
              type='text'
              className={'md-input'}
              value={this.domainName}
              onChange={e => this.onInputChangeDomain(e)}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label>Phone Number</label>
            <input
              type='text'
              className={'md-input'}
              value={this.phone}
              onChange={e => this.onInputChangePhone(e)}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label>Website</label>
            <input
              type='text'
              className={'md-input'}
              value={this.site}
              onChange={e => this.onInputChangeSite(e)}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label>Address</label>
            <input
              type='text'
              className={'md-input'}
              value={this.address}
              onChange={e => this.onInputChangeAddress(e)}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>Group Members</label>
            <MultiSelect
              items={mappedAccounts}
              initialSelected={selectedMembers}
              onChange={() => {}}
              ref={r => (this.membersSelect = r)}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>Send Notifications To</label>
            <MultiSelect
              items={mappedAccounts}
              initialSelected={selectedSendMailTo}
              onChange={() => {}}
              ref={r => (this.sendMailToSelect = r)}
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={'Close'} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={'Save Group'} flat={true} waves={true} style={'primary'} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

EditGroupModal.propTypes = {
  group: PropTypes.object.isRequired,
  accounts: PropTypes.object.isRequired,
  updateGroup: PropTypes.func.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  accountsLoading: PropTypes.bool.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts,
  accountsLoading: state.accountsState.loading
})

export default connect(mapStateToProps, { updateGroup, fetchAccounts, unloadAccounts })(EditGroupModal)
