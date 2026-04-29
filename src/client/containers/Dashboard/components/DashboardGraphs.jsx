import React from 'react'
import PropTypes from 'prop-types'
import TruCard from 'components/TruCard'
import MGraph from 'components/MGraph'

function DashboardGraphs({ ticketBreakdownData, loading }) {
  return (
    <TruCard
      header={
        <div className='uk-text-left'>
          <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Ticket Breakdown</h6>
        </div>
      }
      fullSize={true}
      hover={false}
      extraContentClass={'nopadding'}
      loaderActive={loading}
      content={
        <div className='mGraph mGraph-panel' style={{ minHeight: 250, position: 'relative' }}>
          <MGraph
            height={250}
            x_accessor={'date'}
            y_accessor={'value'}
            data={ticketBreakdownData?.toJS() || []}
          />
        </div>
      }
    />
  )
}

DashboardGraphs.propTypes = {
  ticketBreakdownData: PropTypes.object,
  loading: PropTypes.bool
}

export default DashboardGraphs
