import React from 'react'
import PropTypes from 'prop-types'
import TruCard from 'components/TruCard'
import D3Pie from 'components/D3/d3pie'

const DashboardTopGroups = ({ topGroups, loadingTopGroups }) => (
  <TruCard
    loaderActive={loadingTopGroups}
    animateLoader={true}
    style={{ minHeight: 256 }}
    header={
      <div className='uk-text-left'>
        <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top 5 Groups</h6>
      </div>
    }
    content={
      <div>
        <D3Pie data={topGroups.toJS()} />
      </div>
    }
  />
)

DashboardTopGroups.propTypes = {
  topGroups: PropTypes.object.isRequired,
  loadingTopGroups: PropTypes.bool
}

export default DashboardTopGroups
