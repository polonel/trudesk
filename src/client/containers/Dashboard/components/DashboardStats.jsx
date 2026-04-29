import React from 'react'
import PropTypes from 'prop-types'
import TruCard from 'components/TruCard'
import PeityBar from 'components/Peity/peity-bar'
import PeityPie from 'components/Peity/peity-pie'
import PeityLine from 'components/Peity/peity-line'
import CountUp from 'components/CountUp'

export const StatTotalTickets = ({ timespan, ticketCount }) => (
  <TruCard
    content={
      <div>
        <div className='right uk-margin-top uk-margin-small-right'>
          <PeityBar values={'5,3,9,6,5,9,7'} />
        </div>
        <span className='uk-text-muted uk-text-small'>
          Total Tickets (last {timespan.toString()}d)
        </span>
        <h2 className='uk-margin-remove'>
          <CountUp startNumber={0} endNumber={ticketCount || 0} />
        </h2>
      </div>
    }
  />
)

StatTotalTickets.propTypes = {
  timespan: PropTypes.number.isRequired,
  ticketCount: PropTypes.number
}

export const StatTicketsCompleted = ({ closedCount, ticketCount }) => {
  const closedPercent = ticketCount
    ? Math.round((closedCount / ticketCount) * 100).toString()
    : '0'
  const display = closedPercent !== 'NaN' ? closedPercent : '0'

  return (
    <TruCard
      content={
        <div>
          <div className='right uk-margin-top uk-margin-small-right'>
            <PeityPie type={'donut'} value={`${display}/100`} />
          </div>
          <span className='uk-text-muted uk-text-small'>Tickets Completed</span>
          <h2 className='uk-margin-remove'>
            <span>{display}</span>%
          </h2>
        </div>
      }
    />
  )
}

StatTicketsCompleted.propTypes = {
  ticketCount: PropTypes.number,
  closedCount: PropTypes.number
}

export const StatAvgResponse = ({ ticketAvg }) => (
  <TruCard
    content={
      <div>
        <div className='right uk-margin-top uk-margin-small-right'>
          <PeityLine values={'5,3,9,6,5,9,7,3,5,2'} />
        </div>
        <span className='uk-text-muted uk-text-small'>Avg Response Time</span>
        <h2 className='uk-margin-remove'>
          <CountUp endNumber={ticketAvg || 0} extraText={'hours'} />
        </h2>
      </div>
    }
  />
)

StatAvgResponse.propTypes = {
  ticketAvg: PropTypes.number
}
