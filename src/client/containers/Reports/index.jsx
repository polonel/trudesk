import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import PageTitle from 'components/PageTitle'
import TruCard from 'components/TruCard'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'

import ReportTicketByGroups from 'containers/Reports/subreports/ticketsByGroups'
import ReportTicketsByPriorities from 'containers/Reports/subreports/ticketsByPriorities'

import helpers from 'lib/helpers'

@observer
class ReportsContainer extends React.Component {
  @observable selectedReport = ''

  constructor (props) {
    super(props)

    makeObservable(this)
  }

  componentDidMount () {
    helpers.resizeFullHeight()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    helpers.resizeFullHeight()
  }

  onSelectReportClicked (e, type) {
    e.preventDefault()
    this.selectedReport = type
  }

  render () {
    return (
      <>
        <PageTitle title={'Generate Report'} />
        <Grid>
          <GridItem width={'1-4'} extraClass={'full-height'}>
            <TruCard
              fullSize={true}
              hover={false}
              extraContentClass={'nopadding'}
              content={
                <div>
                  <h6 style={{ padding: '15px 30px', margin: 0, fontSize: '14px' }}>Select Report</h6>
                  <hr className={'nomargin'} />
                  <div style={{ padding: '15px 30px' }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      <li style={{ marginBottom: 5 }}>
                        <a
                          href='#'
                          className={'no-ajaxy'}
                          onClick={e => this.onSelectReportClicked(e, 'tickets_by_groups')}
                        >
                          Tickets by Groups
                        </a>
                      </li>
                      <li>
                        <a
                          href='#'
                          className={'no-ajaxy'}
                          onClick={e => this.onSelectReportClicked(e, 'tickets_by_priorities')}
                        >
                          Tickets by Priorities
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              }
            />
          </GridItem>
          <GridItem width={'3-4'} extraClass={'nopadding'}>
            <div style={{ padding: '15px 25px' }}>
              <div>
                {!this.selectedReport && (
                  <h3 className={'uk-text-muted'} style={{ fontWeight: 300, opacity: 0.7 }}>
                    Please select a report type
                  </h3>
                )}
                {this.selectedReport === 'tickets_by_groups' && <ReportTicketByGroups />}
                {this.selectedReport === 'tickets_by_priorities' && <ReportTicketsByPriorities />}
              </div>
            </div>
          </GridItem>
        </Grid>
      </>
    )
  }
}

ReportsContainer.propTypes = {}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, {})(ReportsContainer)
