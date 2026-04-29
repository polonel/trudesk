import React from 'react'
import PropTypes from 'prop-types'
import TitleContext from 'app/TitleContext'
import { Helmet } from 'react-helmet-async'
import SingleSelect from 'components/SingleSelect'
import PageTitle from 'components/PageTitle'

const DashboardHeader = ({ onTimespanChange }) => {
  return (
    <div>
      <TitleContext.Consumer>
        {({ title }) => (
          <Helmet>
            <title>{title} Dashboard</title>
          </Helmet>
        )}
      </TitleContext.Consumer>
      <PageTitle
        title={'Dashboard'}
        rightComponent={
          <div>
            <div className={'uk-float-right'} style={{ minWidth: 250 }}>
              <div style={{ marginTop: 8 }}>
                <SingleSelect
                  items={[
                    { text: 'Last 30 Days', value: '30' },
                    { text: 'Last 60 Days', value: '60' },
                    { text: 'Last 90 Days', value: '90' },
                    { text: 'Last 180 Days', value: '180' },
                    { text: 'Last 365 Days', value: '365' }
                  ]}
                  defaultValue={'30'}
                  onSelectChange={onTimespanChange}
                />
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}

DashboardHeader.propTypes = {
  onTimespanChange: PropTypes.func.isRequired
}

export default DashboardHeader
