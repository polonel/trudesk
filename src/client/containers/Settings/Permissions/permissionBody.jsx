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
 *  Updated:    2/15/19 6:05 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import { isEqual } from 'lodash'
import { updatePermissions } from 'actions/settings'
import { showModal } from 'actions/common'

import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'
import PermissionGroupPartial from './permissionGroupPartial'

import helpers from 'lib/helpers'

function defaultGrants () {
  return {
    all: false,
    create: false,
    view: false,
    update: false,
    delete: false,
    special: []
  }
}

@observer
class PermissionBody extends React.Component {
  @observable isAdmin = ''
  @observable isAgent = ''
  @observable hasHierarchy = ''
  grants = []

  @observable ticketGrants = defaultGrants()
  @observable commentGrants = defaultGrants()
  @observable accountGrants = defaultGrants()
  @observable groupGrants = defaultGrants()
  @observable teamGrants = defaultGrants()
  @observable departmentGrants = defaultGrants()
  @observable reportGrants = defaultGrants()
  @observable noticeGrants = defaultGrants()

  componentDidMount () {
    this.isAdmin = this.props.role.get('isAdmin') || false
    this.isAgent = this.props.role.get('isAgent') || false
    this.hasHierarchy = this.props.role.get('hierarchy') || false
    this.grants = this.props.role.get('grants').toArray() || []

    this.parseGrants()
  }

  componentDidUpdate () {
    if (this.isAdmin === '') this.isAdmin = this.props.role.get('isAdmin') || false
    if (this.isAgent === '') this.isAgent = this.props.role.get('isAgent') || false
    if (this.hasHierarchy === '') this.hasHierarchy = this.props.role.get('hierarchy') || false
    if (this.grants.length < 1) this.grants = this.props.role.get('grants').toArray() || []

    this.parseGrants()
  }

  parseGrants () {
    if (!this.grants) return
    const parsedGrants = helpers.parseRoleGrants(this.grants)

    if (parsedGrants.tickets && !isEqual(parsedGrants.tickets, this.ticketGrants))
      this.ticketGrants = parsedGrants.tickets

    if (parsedGrants.comments && !isEqual(parsedGrants.comments, this.commentGrants))
      this.commentGrants = parsedGrants.comments

    if (parsedGrants.accounts && !isEqual(parsedGrants.accounts, this.accountGrants))
      this.accountGrants = parsedGrants.accounts

    if (parsedGrants.groups && !isEqual(parsedGrants.groups, this.groupGrants)) this.groupGrants = parsedGrants.groups
    if (parsedGrants.teams && !isEqual(parsedGrants.teams, this.teamGrants)) this.teamGrants = parsedGrants.teams
    if (parsedGrants.departments && !isEqual(parsedGrants.departments, this.departmentGrants))
      this.departmentGrants = parsedGrants.departments

    if (parsedGrants.reports && !isEqual(parsedGrants.reports, this.reportGrants))
      this.reportGrants = parsedGrants.reports

    if (parsedGrants.notices && !isEqual(parsedGrants.notices, this.noticeGrants))
      this.noticeGrants = parsedGrants.notices
  }

  onEnableSwitchChanged (e, name) {
    this[name] = e.target.checked
  }

  static mapTicketSpecials () {
    return [{ title: 'Notes', perm: 'notes' }, { title: 'Manage Public Tickets', perm: 'public' }]
  }

  static mapAccountSpecials () {
    return [{ title: 'Import', perm: 'import' }]
  }

  static mapNoticeSpecials () {
    return [{ title: 'Activate', perm: 'activate' }, { title: 'Deactivate', perm: 'deactivate' }]
  }

  onSubmit (e) {
    e.preventDefault()
    let obj = {}
    obj._id = this.props.role.get('_id')
    if (this.isAdmin) {
      obj.admin = ['*']
      obj.settings = ['*']
    }
    if (this.isAgent) obj.agent = ['*']
    obj.hierarchy = this.hasHierarchy

    obj.tickets = PermissionBody.buildPermArray(this.ticketPermGroup)
    obj.comments = PermissionBody.buildPermArray(this.commentPermGroup)
    obj.accounts = PermissionBody.buildPermArray(this.accountPermGroup)
    obj.groups = PermissionBody.buildPermArray(this.groupPermGroup)
    obj.teams = PermissionBody.buildPermArray(this.teamPermGroup)
    obj.departments = PermissionBody.buildPermArray(this.departmentPermGroup)
    obj.reports = PermissionBody.buildPermArray(this.reportPermGroup)
    obj.notices = PermissionBody.buildPermArray(this.noticePermGroup)

    this.props.updatePermissions(obj)
  }

  static buildPermArray (permGroup) {
    let arr = []
    if (permGroup.all) arr = ['*']
    else {
      if (permGroup.create) arr.push('create')
      if (permGroup.view) arr.push('view')
      if (permGroup.update) arr.push('update')
      if (permGroup.delete) arr.push('delete')
      if (permGroup.special) arr.push(permGroup.special.join(' '))
    }

    return arr
  }

  showDeletePermissionRole (e) {
    e.preventDefault()
    this.props.showModal('DELETE_ROLE', { role: this.props.role })
  }

  render () {
    return (
      <div>
        <form onSubmit={e => this.onSubmit(e)}>
          <SettingItem
            title={'Admin'}
            tooltip={'Role is considered an admin. Enabling management of the trudesk instance.'}
            subtitle={'Is this role defined as an admin role?'}
            component={
              <EnableSwitch
                stateName={'isAdmin_' + this.props.role.get('_id')}
                label={'Enable'}
                checked={this.isAdmin}
                onChange={e => this.onEnableSwitchChanged(e, 'isAdmin')}
              />
            }
          />
          <SettingItem
            title={'Support Agent'}
            subtitle={'Is this role defined as an agent role?'}
            tooltip={'Role is considered an agent role. Enabling agent views and displaying in agent lists.'}
            component={
              <EnableSwitch
                stateName={'isAgent_' + this.props.role.get('_id')}
                label={'Enable'}
                checked={this.isAgent}
                onChange={e => this.onEnableSwitchChanged(e, 'isAgent')}
              />
            }
          />
          <SettingItem
            title={'Enable Hierarchy'}
            subtitle={'Allow this role to manage resources owned by roles defined under it.'}
            component={
              <EnableSwitch
                stateName={'hasHierarchy_' + this.props.role.get('_id')}
                label={'Enable'}
                checked={this.hasHierarchy}
                onChange={e => this.onEnableSwitchChanged(e, 'hasHierarchy')}
              />
            }
          />
          <PermissionGroupPartial
            ref={i => (this.ticketPermGroup = i)}
            title={'Tickets'}
            role={this.props.role}
            grants={this.ticketGrants}
            roleSpecials={PermissionBody.mapTicketSpecials()}
            subtitle={'Ticket Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.commentPermGroup = i)}
            title={'Comments'}
            role={this.props.role}
            grants={this.commentGrants}
            subtitle={'Ticket Comments Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.accountPermGroup = i)}
            title={'Accounts'}
            role={this.props.role}
            roleSpecials={PermissionBody.mapAccountSpecials()}
            grants={this.accountGrants}
            subtitle={'Account Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.groupPermGroup = i)}
            title={'Groups'}
            role={this.props.role}
            grants={this.groupGrants}
            subtitle={'Group Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.teamPermGroup = i)}
            title={'Teams'}
            role={this.props.role}
            grants={this.teamGrants}
            subtitle={'Team Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.departmentPermGroup = i)}
            title={'Departments'}
            role={this.props.role}
            grants={this.departmentGrants}
            subtitle={'Department Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.reportPermGroup = i)}
            title={'Reports'}
            role={this.props.role}
            grants={this.reportGrants}
            subtitle={'Report Permissions'}
          />
          <PermissionGroupPartial
            ref={i => (this.noticePermGroup = i)}
            title={'Notices'}
            role={this.props.role}
            grants={this.noticeGrants}
            roleSpecials={PermissionBody.mapNoticeSpecials()}
            subtitle={'Notice Permissions'}
          />
          <div className={'uk-margin-large-bottom'}>
            <h2 className='text-light'>Danger Zone</h2>
            <div className='danger-zone'>
              <div className='dz-box uk-clearfix'>
                <div className='uk-float-left'>
                  <h5>Delete this permission role?</h5>
                  <p>Once you delete a permission role, there is no going back. Please be certain.</p>
                </div>
                <div className='uk-float-right' style={{ paddingTop: '10px' }}>
                  <Button
                    text={'Delete'}
                    small={true}
                    style={'danger'}
                    onClick={e => this.showDeletePermissionRole(e)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className='box uk-clearfix'>
              <div className='uk-float-right' style={{ paddingTop: '10px' }}>
                <Button type={'submit'} style={'success'} waves={true} text={'Save Permissions'} />
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

PermissionBody.propTypes = {
  role: PropTypes.object.isRequired,
  updatePermissions: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired
}

export default connect(
  null,
  { updatePermissions, showModal }
)(PermissionBody)
