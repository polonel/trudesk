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
 *  Updated:    2/22/19 11:18 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import { showModal } from 'actions/common'
import { fetchAccounts, deleteAccount, enableAccount, unloadAccounts } from 'actions/accounts'

import TruCard from 'components/TruCard'
import PageTitle from 'components/PageTitle'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import PageContent from 'components/PageContent'
import DropdownItem from 'components/Dropdown/DropdownItem'
import DropdownTrigger from 'components/Dropdown/DropdownTrigger'
import DropdownHeader from 'components/Dropdown/DropdownHeader'
import Dropdown from 'components/Dropdown'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'
import InfiniteScroll from 'react-infinite-scroller'

import helpers from 'lib/helpers'

@observer
class AccountsContainer extends React.Component {
  @observable initialLoad = true
  @observable hasMore = true
  @observable pageStart = -1

  constructor (props) {
    super(props)

    this.getUsersWithPage = this.getUsersWithPage.bind(this)
  }

  componentDidMount () {
    this.initialLoad = false
  }

  componentDidUpdate () {
    helpers.resizeFullHeight()
  }

  componentWillUnmount () {
    this.props.unloadAccounts()
  }

  onEditAccountClicked (e, user) {
    e.preventDefault(e)
    const canEditAccount = helpers.hasHierarchyOverRole(user.getIn(['role', '_id']))
    this.props.showModal('EDIT_ACCOUNT', {
      edit: canEditAccount,
      user: user.toJS(),
      roles: this.props.common.roles,
      groups: this.props.common.groups
    })
  }

  onDeleteAccountClicked (e, user) {
    e.preventDefault()
    this.props.deleteAccount({ username: user.get('username') })
  }

  onEnableAccountClicked (e, user) {
    e.preventDefault()
    this.props.enableAccount({ username: user.get('username') })
  }

  getUsersWithPage (page) {
    this.hasMore = false
    this.props.fetchAccounts({ page, limit: 25, type: this.props.view, showDeleted: true }).then(({ response }) => {
      this.hasMore = response.count >= 25
    })
  }

  onSearchKeyUp (e) {
    const keyCode = e.keyCode || e.which
    const search = e.target.value
    if (keyCode === 13) {
      if (search.length > 2) {
        this.props.unloadAccounts().then(() => {
          this.hasMore = false
          this.props.fetchAccounts({ limit: -1, search: search }).then(({ response }) => {
            this.pageStart = -1
            this.hasMore = response.count >= 25
          })
        })
      } else if (search.length === 0) {
        this.props.unloadAccounts().then(() => {
          this.pageStart = -1
          this.getUsersWithPage(0)
        })
      }
    }
  }

  render () {
    const items =
      this.props.accountsState.accounts &&
      this.props.accountsState.accounts.map(user => {
        const userImage = user.get('image') || 'defaultProfile.jpg'
        let actionMenu = [<DropdownItem key={0} text={'Edit'} onClick={e => this.onEditAccountClicked(e, user)} />]
        if (user.get('deleted'))
          actionMenu.push(<DropdownItem key={2} text={'Enable'} onClick={e => this.onEnableAccountClicked(e, user)} />)
        else
          actionMenu.push(
            <DropdownItem
              key={1}
              text={'Delete'}
              extraClass={'uk-text-danger'}
              onClick={e => this.onDeleteAccountClicked(e, user)}
            />
          )
        const isAdmin = user.getIn(['role', 'isAdmin']) || false
        const isAgent = user.getIn(['role', 'isAgent']) || false
        const customer = !isAdmin && !isAgent
        const isDeleted = user.get('deleted') || false
        return (
          <GridItem key={user.get('_id')} width={'1-5'} xLargeWidth={'1-6'} extraClass={'mb-25'}>
            <TruCard
              loaderActive={user.get('loading')}
              menu={actionMenu}
              extraHeadClass={
                (isAdmin ? 'tru-card-head-admin' : '') +
                (!isAdmin && isAgent ? 'tru-card-head-agent' : '') +
                (isDeleted ? ' tru-card-head-deleted' : '')
              }
              header={
                <div>
                  <div className='account-image relative uk-display-inline-block'>
                    <img src={`/uploads/users/${userImage}`} alt='ProfilePic' className={'tru-card-head-avatar'} />
                    <span
                      data-user-status-id={user.get('_id')}
                      className='user-status-large user-offline uk-border-circle'
                    />
                  </div>
                  <h3 className='tru-card-head-text uk-text-center'>
                    {user.get('fullname')}
                    <span className='uk-text-truncate'>{user.get('title')}</span>
                  </h3>
                </div>
              }
              content={
                <ul className='tru-list'>
                  <li>
                    <div className='tru-list-content'>
                      <span className='tru-list-heading'>Role</span>
                      <span className='uk-text-small uk-text-muted'>{user.getIn(['role', 'name'])}</span>
                    </div>
                  </li>
                  <li>
                    <div className='tru-list-content'>
                      <span className='tru-list-heading'>Email</span>
                      <span className='uk-text-small uk-text-muted'>
                        <a href={`mailto:${user.get('email')}`}>{user.get('email')}</a>
                      </span>
                    </div>
                  </li>
                  <li>
                    {customer && user.get('groups') && (
                      <div className='tru-list-content'>
                        <span className='tru-list-heading'>Groups</span>
                        <span className='uk-text-small uk-text-muted uk-text-truncate'>
                          {user.get('groups').map(group => {
                            return group.get('name') + (user.get('groups').toArray().length > 1 ? ', ' : '')
                          })}
                        </span>
                      </div>
                    )}
                    {!customer && user.get('teams') && (
                      <div className='tru-list-content'>
                        <span className='tru-list-heading'>Teams</span>
                        <span className='uk-text-small uk-text-muted uk-text-truncate'>
                          {user.get('teams').map(team => {
                            return team.get('name') + (user.get('teams').toArray().length > 1 ? ', ' : '')
                          })}
                        </span>
                      </div>
                    )}
                  </li>
                  {!customer && user.get('departments') && (
                    <li>
                      <div className='tru-list-content'>
                        <span className='tru-list-heading'>Departments</span>
                        <span className='uk-text-small uk-text-muted uk-text-truncate'>
                          {user.get('departments').map(department => {
                            return department.get('name') + (user.get('departments').toArray().length > 1 ? ', ' : '')
                          })}
                        </span>
                      </div>
                    </li>
                  )}
                </ul>
              }
            />
          </GridItem>
        )
      })

    return (
      <div>
        <PageTitle
          title={this.props.title}
          rightComponent={
            <div className={'uk-grid uk-grid-collapse'}>
              {/*<div className={'uk-width-3-4 pr-10'}>*/}
              {/*  <div className='md-input-wrapper' style={{ marginTop: '10px' }}>*/}
              {/*    <label className={'uk-form-label'}>Find Account</label>*/}
              {/*    <input type='text' className={'md-input uk-margin-remove'} onKeyUp={e => this.onSearchKeyUp(e)} />*/}
              {/*    <div className='md-input-bar' />*/}
              {/*  </div>*/}
              {/*</div>*/}
              <div className={'uk-width-1-4 uk-push-3-4 mt-15 pr-20 uk-clearfix'}>
                <ButtonGroup classNames={'uk-clearfix uk-float-right'}>
                  <Button
                    text={'Create'}
                    hasDropdown={false}
                    flat={false}
                    small={true}
                    waves={false}
                    extraClass={'hover-accent'}
                    onClick={() => this.props.showModal('CREATE_ACCOUNT')}
                  />
                  {helpers.canUser('accounts:import', true) && (
                    <DropdownTrigger mode={'click'} pos={'bottom-right'} offset={5} extraClass={'uk-float-right'}>
                      <Button
                        text={''}
                        hasDropdown={true}
                        small={true}
                        waves={false}
                        styleOverride={{ padding: '0 5px 0 0' }}
                        extraClass={'pr-5 no-border-radius nbl bg-accent md-color-white hover-accent'}
                      />
                      <Dropdown small={true}>
                        <DropdownHeader text={'Account Actions'} />
                        <DropdownItem text={'Import'} href={'/accounts/import'} />
                      </Dropdown>
                    </DropdownTrigger>
                  )}
                </ButtonGroup>
              </div>
            </div>
          }
        />
        <PageContent id={'accounts-page-content'}>
          <InfiniteScroll
            pageStart={this.pageStart}
            loadMore={this.getUsersWithPage}
            hasMore={this.hasMore}
            initialLoad={this.initialLoad}
            threshold={25}
            loader={
              <div className={'uk-width-1-1 uk-text-center'} key={0}>
                <i className={'uk-icon-refresh uk-icon-spin'} />
              </div>
            }
            useWindow={false}
            getScrollParent={() => document.getElementById('accounts-page-content')}
          >
            <Grid gutterSize={'medium'}>{items}</Grid>
          </InfiniteScroll>
        </PageContent>
      </div>
    )
  }
}

AccountsContainer.propTypes = {
  title: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  deleteAccount: PropTypes.func.isRequired,
  enableAccount: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  common: PropTypes.object.isRequired,
  shared: PropTypes.object.isRequired,
  accountsState: PropTypes.object.isRequired
}

AccountsContainer.defaultProps = {
  title: 'Accounts',
  view: 'customers'
}

const mapStateToProps = state => ({
  shared: state.shared,
  accountsState: state.accountsState,
  common: state.common
})

export default connect(
  mapStateToProps,
  { fetchAccounts, deleteAccount, enableAccount, unloadAccounts, showModal }
)(AccountsContainer)
