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
import axios from 'axios'
import Log from '../../logger'

import { showModal } from 'actions/common'
import { fetchAccounts, unloadAccounts } from 'actions/accounts'

import TruCard from 'components/TruCard'
import PageTitle from 'components/PageTitle'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import PageContent from 'components/PageContent'
import DropdownItem from 'components/Drowdown/DropdownItem'
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
    this.props.showModal('EDIT_ACCOUNT', {
      user: user.toJS(),
      roles: this.props.common.roles,
      groups: this.props.common.groups
    })
  }

  getUsersWithPage (page) {
    this.props.fetchAccounts({ page, limit: 25 }).then(({ response, payload }) => {
      if (response.count < 25) this.hasMore = false
    })
  }

  onSearchKeyUp (e) {
    const keyCode = e.keyCode || e.which
    const search = e.target.value
    if (keyCode === 13) {
      if (search.length > 2) {
        this.props.unloadAccounts().then(() => {
          this.props.fetchAccounts({ limit: 1000, search: search }).then(({ response }) => {
            this.pageStart = -1
            if (response.count < 25) this.hasMore = false
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
    const items = this.props.accountsState.accounts.map(user => {
      const userImage = user.get('image') || 'defaultProfile.jpg'
      let actionMenu = [<DropdownItem key={0} text={'Edit'} onClick={e => this.onEditAccountClicked(e, user)} />]
      if (user.get('deleted')) actionMenu.push(<DropdownItem key={2} text={'Enable'} />)
      else actionMenu.push(<DropdownItem key={1} text={'Delete'} extraClass={'uk-text-danger'} />)
      const isAdmin = user.getIn(['role', 'isAdmin']) || false
      const isAgent = user.getIn(['role', 'isAgent']) || false
      return (
        <GridItem key={user.get('_id')} width={'1-5'} extraClass={'mb-25'}>
          <TruCard
            menu={actionMenu}
            extraHeadClass={(isAdmin ? 'tru-card-head-admin' : '') + (!isAdmin && isAgent ? 'tru-card-head-agent' : '')}
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
                  <div className='tru-list-content'>
                    <span className='tru-list-heading'>Groups</span>
                    <span className='uk-text-small uk-text-muted uk-text-truncate'>
                      {user.get('groups').map(group => {
                        return group.get('name') + (user.get('groups').length > 1 ? ', ' : '')
                      })}
                    </span>
                  </div>
                </li>
              </ul>
            }
          />
        </GridItem>
      )
    })

    return (
      <div>
        <PageTitle
          title={'Accounts'}
          rightComponent={
            <div className={'uk-push-1-4 uk-width-3-4 pr-20'}>
              <div className='md-input-wrapper' style={{ marginTop: '10px' }}>
                <label className={'uk-form-label'}>Find Account</label>
                <input type='text' className={'md-input uk-margin-remove'} onKeyUp={e => this.onSearchKeyUp(e)} />
                <div className='md-input-bar' />
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
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  common: PropTypes.object.isRequired,
  accountsState: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  accountsState: state.accountsState,
  common: state.common
})

export default connect(
  mapStateToProps,
  { fetchAccounts, unloadAccounts, showModal }
)(AccountsContainer)
