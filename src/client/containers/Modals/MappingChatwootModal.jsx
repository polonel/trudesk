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
import { each, without, uniq } from 'lodash'
import { fromJS, List } from 'immutable'

import Table from 'components/Table'
import TableHeader from 'components/Table/TableHeader'
import TableRow from 'components/Table/TableRow'
import TitlePagination from 'components/TitlePagination'
import PageContent from 'components/PageContent'
import TableCell from 'components/Table/TableCell'
import { createAccount, fetchAccounts, saveEditAccount,
   unloadAccounts, findAccounts, clearStateAccounts } from 'actions/accounts'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchRoles, showModal } from 'actions/common'
import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'
import SingleSelect from 'components/SingleSelect'
import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'
import Chance from 'chance'
import setting from '../../../models/setting'
import axios from 'axios'
import InfiniteScroll from 'react-infinite-scroller'


@observer
class MappingChatwootContainer extends React.Component {

  @observable username = this.props.email
  @observable fullname = this.props.username
  @observable email = this.props.email
  // @observable phone = this.props.phone.replace(' ','+')
  @observable phone = this.props.phone.replace(' ', '+')
  @observable title = this.props.username
  @observable selectedUser = ''
  @observable defaultUser = ''
  @observable isAgentRole = false
  @observable chance = new Chance()
  @observable plainTextPass = this.chance.string({
    length: 10,
    pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
  })
  @observable password = this.plainTextPass
  @observable passwordConfirm = this.password
  @observable contactID = this.props.contactID
  @observable accountID = this.props.accountID
  @observable customAttributes = this.props.customAttributes
  @observable defaultRole
  @observable defaultGroup
  @observable search =''
  @observable foundUsers = true
  @observable pageStart = -1
  @observable hasMore = true
  @observable initialLoad = true


  selectedUsers = []
  constructor(props) {
    super(props)
    makeObservable(this)
    this.getUsersWithPage = this.getUsersWithPage.bind(this)
  }

  componentDidMount() {
    this.props.fetchGroups({ type: 'all' })
    // this.props.fetchTeams()
    // this.props.fetchRoles()
    // this.props.fetchAccounts()
    // this.props.fetchTickets({ limit: 50, page: this.props.page, type: this.props.view, filter: this.props.filter })
    // this.props.fetchAccounts({ page, limit: 25, type: this.props.view, showDeleted: true }).then(({ response }) => {
      // this.props.fetchAccounts({ limit: 5, type: this.props.view, search:this.search, showDeleted: true }).then(({ response }) => {

      //   this.hasMore = response.count >= 5
      // })
    this.props.fetchAccounts({ limit: 5, type: this.props.view, showDeleted: true }).then(({ response }) => {
        this.hasMore = response.count >= 5
      })
      // console.log(content);
    helpers.UI.inputs()
    this.initialLoad = false
    helpers.formvalidator()
  }
  componentWillUnmount() {
    this.props.unloadAccounts()
  }

  componentDidUpdate() {
    helpers.UI.reRenderInputs()
  }

  onInputChanged(e, name) {
    this[name] = e.target.value
  }

  onUserSelectChange(e) {
    this.selectedUser = e.target.value
    const userObject = this.props.accountsState.accounts.find(user => {
      return user.get('_id') === this.selectedUser
    })
  }

  onUserRadioChange(e) {
    this.selectedUser = e.target.value
  }

  onSearchChanged (e) {
    this.hasMore = false
    this.search = e.target.value
    // this.props.clearStateAccounts({ limit: 5, type: this.props.view, search: this.search, showDeleted: true }).then(({ response }) => {
    //   this.hasMore = response.count >= 5
    // })
    // this.props.accountsState.accounts =List([]);



    console.log('this.props.accountsState.accounts')
    console.log(this.props.accountsState.accounts)

    console.log('this.search')
    console.log(this.search)
  if (this.search !=='' || this.search !==undefined){
    console.log('Search не пустой')
    console.log(this.search)
    this.props.fetchAccounts({ limit: 5, type: this.props.view, search:this.search, showDeleted: true }).then(({ response }) => {
      this.hasMore = response.count >= 5
    })
  }else{
    console.log('Search пустой')
    this.props.fetchAccounts({ limit: 5, type: this.props.view, showDeleted: true }).then(({ response }) => {
      this.hasMore = response.count >= 5
    })
  }

  }

  getUsersWithPage(page) {
    this.hasMore = false

      console.log('getUsersWithPage')
      console.log('this.search: '+this.search)
      this.props.fetchAccounts({ page, limit: 5,search:this.search, type: this.props.view, showDeleted: true }).then(({ response }) => {
        console.log('response.count: '+response.count);
        this.hasMore = response.count >= 5

    
  })
  }


  onGroupSelectChange() {
    const selectedGroups = this.groupSelect.getSelected()
    console.log(selectedGroups)
    console.log(this.groupSelect)
    if (!selectedGroups || selectedGroups.length < 1) this.groupSelectErrorMessage.classList.remove('hide')
    else this.groupSelectErrorMessage.classList.add('hide')
  }

  //Валидация номера телефона
  _validatePhone(phone) {
    if (!phone) return false
    return phone
      .toString()
      .toLowerCase()
      .match(
        /^\+(\d{11})$/
      )
  }

  onUserCheckChanged(e, id) {
    if (e.target.checked) this.selectedUser = id
    else this.selectedUser = without(this.selectedUser, id)

    this.selectedUser = uniq(this.selectedUser)
  }

  onFormSubmit(e) {
    e.preventDefault()
    if (this.selectedUser == undefined || this.selectedUser == '') {
      this.selectedUser = this.defaultUser;
    }
    if (!this._validatePhone(this.phone)) {
      helpers.UI.showSnackbar('Invalid Phone', true)
      return
    }

    const users = this.props.accountsState.accounts
      .map(user => {
        return { text: user.get('email'), value: user.get('_id'), username: user.get('username'), phone: user.get('phone') }
      })
      .toArray()

    let updateUser = {
      username: '',
      email: '',
      phone: ''
    }

    for (let user of users) {
      if (user.value == this.selectedUser) {
        updateUser.username = user.username;
        updateUser.email = user.text;
        updateUser.phone = user.phone;
      }
    }

    const data = {
      username: updateUser.username,
      email: updateUser.email,
      phone: this.phone
    }
    this.props.saveEditAccount(data)

    const contact = {
      "email": updateUser.email,
      "phone_number": this.phone
    }
    let config = {
      method: 'put',
      url: `https://cw.shatura.pro/api/v1/accounts/${this.accountID}/contacts/${this.contactID}`,
      headers: {
        'api_access_token': 'DmqbNynqFJFK7ZDdpHv4AQzf',
        'Content-Type': 'application/json',
      },
      data: contact
    };
    axios(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    const roles = this.props.roles
      .map(role => {
        return { text: role.get('name'), value: role.get('_id') }
      })
      .toArray()

    let defaultRole;
    for (let role of roles) {
      if (role.text == 'User') {
        defaultRole = role.value;
      }
    }

    const users = this.props.accountsState.accounts
      .map(user => {
        return { text: user.get('email'), value: user.get('_id'), phone: user.get('phone') }
      })
      .toArray()

    for (let user of users) {
      if (user.text == this.email) {
        this.defaultUser = user.value;
      }
    }

    if (this.defaultUser == undefined || this.defaultUser == '') {
      for (let user of users) {
        if (user.phone == this.phone) {
          this.defaultUser = user.value;
        }
      }
    }

    let rowsUsers =
      // this.props.accountsState.accounts &&
      this.props.accountsState.accounts.map(user => {
        let groupUser;
        this.props.groups.map(group => {
          let members = group.get('members').toArray();
          let member;
          members.map(userGroup => {
            if (userGroup.get('_id') == user.get('_id')) {
              if (userGroup.get('_id') !== undefined) {
                member = userGroup.get('_id')
              }
            }
          });
          if (member !== undefined) {
            groupUser = group.get('name');
          }
        });
        console.log(user.get('_id'))

        if (user.get('username').toLowerCase().includes(this.search.toLowerCase()))
        return (
          <TableRow
            key={user.get('_id')}
            clickable={true}
            
          >
            <TableCell className={'vam nbb'}>
              <div key={user.get('_id')} className={'uk-float-left'}>
                <span className={'icheck-inline'}>
                  <input
                    id={'u___' + user.get('_id')}
                    name={'user'}
                    type='radio'
                    className={'with-gap'}
                    value={user.get('_id')}
                    onChange={e => {
                      this.onUserRadioChange(e)
                    }}
                    checked={this.selectedUser === user.get('_id')}
                    data-md-icheck
                  />
                  <label htmlFor={'u___' + user.get('_id')} className={'mb-10 inline-label'}>

                  </label>
                </span>
              </div>
            </TableCell>
            <TableCell className={'vam nbb'}>{user.get('username')}</TableCell>
            <TableCell className={'vam nbb'}>{user.get('fullname')}</TableCell>
            <TableCell className={'vam nbb'}>{user.get('email')}</TableCell>
            <TableCell className={'vam nbb'}>{groupUser}</TableCell>
          </TableRow>
        )
      })

      
    return (
      <BaseModal parentExtraClass={'pt-0'} extraClass={'p-0 pb-25'} style={{ width: '80%' }}>
        <div className='user-heading-content' style={{ background: '#1976d2', padding: '24px' }}>
          <h2>
            <span className={'uk-text-truncate'}>User Mapping</span>
          </h2>
        </div>
        <div style={{ margin: '24px 24px 0 24px' }}>
        
          <form className='uk-form-stacked' onSubmit={e => this.onFormSubmit(e)} style={{ position: 'center' }}>
         
            <div className='uk-margin-medium-bottom'>
              <label className='uk-form-label'>Phone</label>
              <input
                type='text'
                className={'md-input'}
                value={this.phone}
                onChange={e => this.onInputChanged(e, 'phone')}
              />
            </div>
            <input
                      type='text'
                      id='tickets_Search'
                      placeholder={'Search'}
                      className={'ticket-top-search'}
                      value={this.search}
                      onChange={e => this.onSearchChanged(e)}
                      // onFocus={e => this._onSearchFocus(e)}
                    />
            {/* <div className='uk-margin-medium-bottom'>
              <label className={'uk-form-label'}>User</label>
              <SingleSelect
                items={users}
                width={'100'}
                showTextbox={false}
                defaultValue={this.defaultUser}
                onSelectChange={e => this.onUserSelectChange(e)}
              />
              <span
                className='hide help-block'
                style={{ display: 'inline-block', marginTop: '10px', fontWeight: 'bold', color: '#d85030' }}
                ref={r => (this.roleSelectErrorMessage = r)}
              >
                Please select a role for this user
              </span>
            </div> */}
            <PageContent id={'mapping-page-content'} padding={0}>
            <InfiniteScroll
                  pageStart={this.pageStart}
                  loadMore={this.getUsersWithPage}
                  hasMore={this.hasMore}
                  initialLoad={this.initialLoad}
                  threshold={5}
                  loader={
                    <div className={'uk-width-1-1 uk-text-center'} key={0}>
                      <i className={'uk-icon-refresh uk-icon-spin'} />
                    </div>
                  }
                  useWindow={false}
                  getScrollParent={() => document.getElementById('mapping-page-content')}   
                >
            <Table
              tableRef={ref => (this.usersTable = ref)}
              style={{ margin: 0 }}
              extraClass={'pDataTable'}
              stickyHeader={true}
              striped={true}
              headers={[
                <TableHeader key={0} width={'5%'} height={50} />,
                <TableHeader key={1} width={'20%'} text={'Username'} />,
                <TableHeader key={2} width={'20%'} text={'Name'} />,
                <TableHeader key={3} width={'20%'} text={'Email'} />,
                <TableHeader key={4} width={'10%'} text={'Group'} />,
              ]}
            >
              {     
          this.props.accountsState.accounts.map(user => {
             let groupUser; 
             this.props.groups.map(group => {
                  let members = group.get('members').toArray();
                  let member;
                  members.map(userGroup => {
                    if(userGroup.get('_id') == user.get('_id')){
                      if(userGroup.get('_id')!==undefined)
                      {
                        member = userGroup.get('_id')
                      }  
                    }
                  });
                  if(member !== undefined){
                    groupUser = group.get('name');
                  }
                }); 
                return (
                  <TableRow
                    key={user.get('_id')}
                    clickable={true}
                  >
                    <TableCell  className={'vam nbb'}>
                    <div key={user.get('_id')} className={'uk-float-left'}>
                    <span className={'icheck-inline'}>
                    <input
                        id={'u___' + user.get('_id')}
                        name={'user'}
                        type='radio'
                        className={'with-gap'}
                        value={user.get('_id')}
                        onChange={e => {
                          this.onUserRadioChange(e)
                        }}
                        checked={this.selectedUser === user.get('_id')}
                        data-md-icheck
                      />
                       <label htmlFor={'u___' + user.get('_id')} className={'mb-10 inline-label'}>

                      </label>
                    </span>
                  </div>
                    </TableCell>
                    <TableCell className={'vam nbb'}>{user.get('username')}</TableCell>
                    <TableCell className={'vam nbb'}>{user.get('fullname')}</TableCell>
                    <TableCell className={'vam nbb'}>{user.get('email')}</TableCell>
                    <TableCell className={'vam nbb'}>{groupUser}</TableCell>
                  </TableRow>
                )
              })}



              {/* <PageContent id={'mapping-page-content'} width='80%' >
                <InfiniteScroll
                  pageStart={this.pageStart}
                  loadMore={this.getUsersWithPage}
                  hasMore={this.hasMore}
                  initialLoad={this.initialLoad}
                  threshold={5}
                  loader={
                    <div className={'uk-width-1-1 uk-text-center'} key={0}>
                      <i className={'uk-icon-refresh uk-icon-spin'} />
                    </div>
                  }
                  useWindow={false}
                  getScrollParent={() => document.getElementById('mapping-page-content')}
                  
                >
                  {rowsUsers}
                </InfiniteScroll>
                </PageContent> */}
                
               
            </Table>
              </InfiniteScroll>   
              </PageContent> 
            <div className='uk-modal-footer uk-text-right'>
              <button class="uk-clearfix md-btn md-btn-flat  md-btn-wave waves-effect waves-button" type="button">
                <a class="uk-float-left uk-width-1-1 uk-text-center" href={`https://trudesk-dev.shatura.pro/changeMappingOrCreate?username=${this.username}&phone=${this.phone}&email=${this.email}&contactID=${this.contactID}&accountID=${this.accountID}&customAttributes=${this.customAttributes}`}>
                  Close
                </a>
              </button>
              <Button text={'Link to Chatwoot'} flat={true} waves={true} style={'success'} type={'submit'} />
              <Button
              text={'Ok'}
              type={'button'}
              flat={true}
              waves={true}
              style={'success'}
              onClick={e => this.onOkClicked(e)}
            />
            </div>
          </form>
          
        </div>
      </BaseModal>


    )
  }
}

MappingChatwootContainer.propTypes = {
  common: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired,
  teams: PropTypes.object.isRequired,
  roles: PropTypes.object.isRequired,
  createAccount: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  fetchRoles: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  accountsState: PropTypes.object.isRequired,
  saveEditAccount: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  roles: state.shared.roles,
  common: state.common,
  groups: state.groupsState.groups,
  teams: state.teamsState.teams,
  accountsState: state.accountsState,
})

MappingChatwootContainer.defaultProps = {
  // view: 'customers'
  view: 'all'
}

export default connect(mapStateToProps, {
  createAccount,
  fetchGroups,
  unloadGroups,
  fetchTeams,
  unloadTeams,
  fetchRoles,
  fetchAccounts,
  saveEditAccount,
  showModal,
  unloadAccounts,
  findAccounts,
  clearStateAccounts
})(MappingChatwootContainer)