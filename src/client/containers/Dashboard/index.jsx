import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
} from 'actions/dashboard'

import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import PageContent from 'components/PageContent'

import DashboardHeader from './components/DashboardHeader'
import { StatTotalTickets, StatTicketsCompleted, StatAvgResponse } from './components/DashboardStats'
import DashboardGraphs from './components/DashboardGraphs'
import DashboardTickets from './components/DashboardTickets'
import DashboardQuickStats from './components/DashboardQuickStats'
import DashboardTopGroups from './components/DashboardTopGroups'
import DashboardTopTags from './components/DashboardTopTags'

import helpers from 'lib/helpers'

function DashboardContainer ({
  dashboardState: {
    ticketCount,
    closedCount,
    ticketAvg,
    ticketBreakdownData,
    topGroups,
    topTags,
    loading,
    loadingTopGroups,
    loadingTopTags,
    overdueTickets,
    mostRequester,
    mostCommenter,
    mostAssignee,
    mostActiveTicket
  },
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
}) {
  const [timespan, setTimespan] = useState(30)

  useEffect(() => {
    helpers.UI.setupPeity()
    fetchDashboardData({ timespan })
    fetchDashboardTopGroups({ timespan })
    fetchDashboardTopTags({ timespan })
    fetchDashboardOverdueTickets()
  }, [])

  const onTimespanChange = e => {
    e.preventDefault()
    const next = Number(e.target.value)
    setTimespan(next)
    fetchDashboardData({ timespan: next })
    fetchDashboardTopGroups({ timespan: next })
    fetchDashboardTopTags({ timespan: next })
  }

  return (
    <div>
      <DashboardHeader onTimespanChange={onTimespanChange} />
      <PageContent>
        <Grid>
          <GridItem width={'1-3'}>
            <StatTotalTickets timespan={timespan} ticketCount={ticketCount} />
          </GridItem>
          <GridItem width={'1-3'}>
            <StatTicketsCompleted ticketCount={ticketCount} closedCount={closedCount} />
          </GridItem>
          <GridItem width={'1-3'}>
            <StatAvgResponse ticketAvg={ticketAvg} />
          </GridItem>
          <GridItem width={'1-1'} extraClass={'uk-margin-medium-top'}>
            <DashboardGraphs ticketBreakdownData={ticketBreakdownData} loading={loading} />
          </GridItem>
          <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
            <DashboardTopGroups topGroups={topGroups} loadingTopGroups={loadingTopGroups} />
          </GridItem>
          <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
            <DashboardTopTags topTags={topTags} loadingTopTags={loadingTopTags} />
          </GridItem>
          <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
            <DashboardTickets overdueTickets={overdueTickets} />
          </GridItem>
          <GridItem width={'1-2'} extraClass={'uk-margin-medium-top'}>
            <DashboardQuickStats
              mostRequester={mostRequester}
              mostCommenter={mostCommenter}
              mostAssignee={mostAssignee}
              mostActiveTicket={mostActiveTicket}
            />
          </GridItem>
        </Grid>
      </PageContent>
    </div>
  )
}

DashboardContainer.propTypes = {
  dashboardState: PropTypes.object.isRequired,
  fetchDashboardData: PropTypes.func.isRequired,
  fetchDashboardTopGroups: PropTypes.func.isRequired,
  fetchDashboardTopTags: PropTypes.func.isRequired,
  fetchDashboardOverdueTickets: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  dashboardState: state.dashboardState
})

export default connect(mapStateToProps, {
  fetchDashboardData,
  fetchDashboardTopGroups,
  fetchDashboardTopTags,
  fetchDashboardOverdueTickets
})(DashboardContainer)
