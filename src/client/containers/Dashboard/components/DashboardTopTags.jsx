import React from 'react'
import PropTypes from 'prop-types'
import TruCard from 'components/TruCard'
import D3Pie from 'components/D3/d3pie'

const DashboardTopTags = ({ topTags, loadingTopTags }) => (
  <TruCard
    loaderActive={loadingTopTags}
    animateLoader={true}
    animateDelay={800}
    style={{ minHeight: 256 }}
    header={
      <div className='uk-text-left'>
        <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Top 10 Tags</h6>
      </div>
    }
    content={
      <div>
        <D3Pie
          type={'donut'}
          data={topTags.toJS()}
          emptyLabel={'No Data Available'}
        />
      </div>
    }
  />
)

DashboardTopTags.propTypes = {
  topTags: PropTypes.object.isRequired,
  loadingTopTags: PropTypes.bool
}

export default DashboardTopTags
