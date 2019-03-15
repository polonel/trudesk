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

import { fetchTeams, unloadTeams } from 'actions/teams'

import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import DropdownItem from 'components/Dropdown/DropdownItem'
import TruCard from 'components/TruCard'
import InfiniteScroll from 'react-infinite-scroller'

import helpers from 'lib/helpers'

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

  render () {
    const items = this.props.teamsState.teams.map(team => {
      let actionMenu = [<DropdownItem key={0} text={'Edit'} />]
      if (helpers.canUser('teams:delete', true))
        actionMenu.push(<DropdownItem key={1} text={'Delete'} extraClass={'uk-text-danger'} />)
      return (
        <GridItem key={team.get('_id')} width={'1-5'} xLargeWidth={'1-6'} extraClass={'mb-25'}>
          <TruCard
            loaderActive={team.get('loading')}
            extraContentClass={'p-10'}
            menu={actionMenu}
            header={
              <div className={'pt-15 pb-15'}>
                <h3>{team.get('name')}</h3>
              </div>
            }
            content={
              <div className={'uk-clearfix'}>
                <h6 style={{ margin: '0 0 8px 0', lineHeight: 1, fontSize: 13 }}>Members</h6>
                {team.get('members').map(member => {
                  const memberImage = member.get('image') ? member.get('image') : 'defaultProfile.jpg'
                  return (
                    <div key={member.get('_id')}>
                      <div
                        className={'uk-display-inline-block uk-float-left'}
                        style={{ marginRight: 3 }}
                        data-uk-tooltip='{pos: `bottom`}'
                        title={member.get('fullname')}
                      >
                        <img
                          src={`/uploads/users/${memberImage}`}
                          height={25}
                          width={25}
                          className={'round'}
                          alt={member.get('fullname')}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            }
          />
        </GridItem>
      )
    })
    return (
      <div>
        <PageTitle title={'Teams'} />
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
  unloadTeams: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  teamsState: state.teamsState
})

export default connect(
  mapStateToProps,
  { fetchTeams, unloadTeams }
)(TeamsContainer)
