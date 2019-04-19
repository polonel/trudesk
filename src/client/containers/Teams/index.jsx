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

import { fetchTeams, unloadTeams, deleteTeam } from 'actions/teams'
import { showModal } from 'actions/common'

import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'

import helpers from 'lib/helpers'
import Button from 'components/Button'
import UIKit from 'uikit'
import Table from 'components/Table'
import TableRow from 'components/Table/TableRow'
import TableCell from 'components/Table/TableCell'
import TableHeader from 'components/Table/TableHeader'
import ButtonGroup from 'components/ButtonGroup'

class TeamsContainer extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.props.fetchTeams({ page: 0, limit: 1000 })
  }

  componentDidUpdate () {
    helpers.resizeFullHeight()
  }

  componentWillUnmount () {
    this.props.unloadTeams()
  }

  onCreateTeamClick (e) {
    e.preventDefault()
    this.props.showModal('CREATE_TEAM')
  }

  onEditTeamClick (team) {
    if (team.members) {
      team.members = team.members.map(m => {
        return m._id
      })
    } else {
      team.members = []
    }

    this.props.showModal('EDIT_TEAM', { team })
  }

  onDeleteTeamClick (_id) {
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
    const tableItems = this.props.teamsState.teams.map(team => {
      return (
        <TableRow key={team.get('_id')} className={'vam nbb'}>
          <TableCell style={{ fontWeight: 500, padding: '18px 15px' }}>{team.get('name')}</TableCell>
          <TableCell style={{ padding: '13px 8px 8px 8px' }}>
            {team.get('members') &&
              team.get('members').size > 0 &&
              team
                .get('members')
                .filter(user => {
                  return !user.get('deleted')
                })
                .map(user => {
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
          </TableCell>
          <TableCell style={{ textAlign: 'right', paddingRight: 15 }}>
            <ButtonGroup>
              {helpers.canUser('teams:update', true) && (
                <Button text={'Edit'} small={true} waves={true} onClick={() => this.onEditTeamClick(team.toJS())} />
              )}
              {helpers.canUser('teams:delete', true) && (
                <Button
                  text={'Delete'}
                  style={'danger'}
                  small={true}
                  waves={true}
                  onClick={() => this.onDeleteTeamClick(team.get('_id'))}
                />
              )}
            </ButtonGroup>
          </TableCell>
        </TableRow>
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
        <PageContent id={'teams-page-content'} padding={0} paddingBottom={0}>
          <Table
            headers={[
              <TableHeader key={0} width={'25%'} height={40} text={'Name'} padding={'8px 8px 8px 15px'} />,
              <TableHeader key={1} width={'50%'} text={'Team Members'} />,
              <TableHeader key={2} width={130} text={'Team Actions'} />
            ]}
          >
            {this.props.teamsState.teams.size < 1 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <h5 style={{ paddingLeft: 8 }}>No Teams</h5>
                </TableCell>
              </TableRow>
            )}
            {tableItems}
          </Table>
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
