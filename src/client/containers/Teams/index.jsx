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
 *  Updated:    3/14/19 12:14 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { fetchTeams, unloadTeams, deleteTeam } from 'actions/teams'
import { showModal } from 'actions/common'

import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import DropdownItem from 'components/Dropdown/DropdownItem'
import TruCard from 'components/TruCard'
import InfiniteScroll from 'react-infinite-scroller'

import helpers from 'lib/helpers'
import Button from 'components/Button'
import UIKit from 'uikit'

@observer
class TeamsContainer extends React.Component {
  @observable initialLoad = true
  @observable hasMore = true
  @observable pageStart = -1

  constructor (props) {
    super(props)

    this.getTeamsWithPage = this.getTeamsWithPage.bind(this)
  }

  componentDidMount () {
    this.initialLoad = false
  }

  componentDidUpdate () {
    helpers.resizeFullHeight()
  }

  componentWillUnmount () {
    this.props.unloadTeams()
  }

  getTeamsWithPage (page) {
    this.props.fetchTeams({ page, limit: 25 }).then(({ response }) => {
      if (response.count < 25) this.hasMore = false
    })
  }

  onCreateTeamClick (e) {
    e.preventDefault()
    this.props.showModal('CREATE_TEAM')
  }

  onEditTeamClick (e, team) {
    e.preventDefault()
    if (team.members) {
      team.members = team.members.map(m => {
        return m._id
      })
    } else {
      team.members = []
    }

    this.props.showModal('EDIT_TEAM', { team })
  }

  onDeleteTeamClick (e, _id) {
    e.preventDefault()
    UIKit.modal.confirm(
      `<h2>Are you sure?</h2>
        <p style="font-size: 15px;">
            <span class="uk-text-danger" style="font-size: 15px;">This is a permanent action.</span> 
        </p>
        <p style="font-size: 12px;">
            Agents may lose access to resources once this team is deleted.
        </p>
        `,
      () => {
        this.props.deleteTeam({ _id })
      },
      {
        labels: { Ok: 'Yes', Cancel: 'No' },
        confirmButtonClass: 'md-btn-danger'
      }
    )
  }

  render () {
    const items = this.props.teamsState.teams.map(team => {
      let actionMenu = [<DropdownItem key={0} text={'Edit'} onClick={e => this.onEditTeamClick(e, team.toJS())} />]
      if (helpers.canUser('teams:delete', true))
        actionMenu.push(
          <DropdownItem
            key={1}
            text={'Delete'}
            extraClass={'uk-text-danger'}
            onClick={e => this.onDeleteTeamClick(e, team.get('_id'))}
          />
        )
      return (
        <GridItem key={team.get('_id')} width={'1-4'} xLargeWidth={'1-5'} extraClass={'mb-25'}>
          <TruCard
            menu={actionMenu}
            header={<h2 className={'p-15 nomargin font-light uk-text-left'}>{team.get('name')}</h2>}
            content={
              <div>
                <h5 style={{ fontWeight: 500 }}>Team Members</h5>
                <div className={'uk-clearfix'}>
                  {!team.get('members') ||
                    (team.get('members').size < 1 && (
                      <div>
                        <h5 style={{ margin: '0 0 15px 0' }}>No Members</h5>
                      </div>
                    ))}
                  {team.get('members') &&
                    team.get('members').size > 0 &&
                    team.get('members').map(user => {
                      const profilePic = user.get('image') || 'defaultProfile.jpg'
                      return (
                        <div
                          key={user.get('_id')}
                          className={'uk-float-left uk-position-relative mb-10'}
                          data-uk-tooltip={'{pos: "bottom"}'}
                          title={user.get('fullname')}
                        >
                          <img
                            style={{ width: 25, height: 25, marginRight: 5 }}
                            className={'round'}
                            src={`/uploads/users/${profilePic}`}
                            alt={user.get('fullname')}
                          />
                          <span
                            data-user-status-id={user.get('_id')}
                            className='user-offline uk-border-circle'
                            style={{ width: 13, height: 13 }}
                          />
                        </div>
                      )
                    })}
                </div>
              </div>
            }
          />
        </GridItem>
      )
    })
    return (
      <div>
        <PageTitle
          title={'Teams'}
          shadow={true}
          rightComponent={
            <div className={'uk-grid uk-grid-collapse'}>
              <div className={'uk-width-1-1 mt-15 uk-text-right'}>
                <Button
                  text={'Create'}
                  flat={false}
                  small={true}
                  waves={false}
                  extraClass={'hover-accent'}
                  onClick={e => this.onCreateTeamClick(e)}
                />
              </div>
            </div>
          }
        />
        <PageContent id={'teams-page-content'}>
          <InfiniteScroll
            pageStart={this.pageStart}
            loadMore={this.getTeamsWithPage}
            hasMore={this.hasMore}
            initialLoad={this.initialLoad}
            threshold={25}
            loader={
              <div className={'uk-width-1-1 uk-text-center'} key={0}>
                <i className={'uk-icon-refresh uk-icon-spin'} />
              </div>
            }
            useWindow={false}
            getScrollParent={() => document.getElementById('teams-page-content')}
          >
            <Grid gutterSize={'medium'}>{items}</Grid>
          </InfiniteScroll>
        </PageContent>
      </div>
    )
  }
}

TeamsContainer.propTypes = {
  teamsState: PropTypes.object.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  deleteTeam: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  teamsState: state.teamsState
})

export default connect(
  mapStateToProps,
  { fetchTeams, unloadTeams, deleteTeam, showModal }
)(TeamsContainer)
