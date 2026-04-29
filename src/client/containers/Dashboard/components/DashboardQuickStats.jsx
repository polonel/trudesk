import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import TruCard from 'components/TruCard'

const DashboardQuickStats = ({ mostRequester, mostCommenter, mostAssignee, mostActiveTicket }) => {
  return (
    <TruCard
      header={
        <div className='uk-text-left'>
          <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Quick Stats (Last 365 Days)</h6>
        </div>
      }
      content={
        <div className='uk-overflow-container'>
          <table className='uk-table'>
            <thead>
              <tr>
                <th className='uk-text-nowrap'>Stat</th>
                <th className='uk-text-nowrap uk-text-right'>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className='uk-table-middle'>
                <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                  Most tickets by...
                </td>
                <td id='mostRequester' className='uk-width-4-10 uk-text-right  uk-text-small'>
                  {mostRequester
                    ? `${mostRequester.get(
                        'name'
                      )} (${mostRequester.get('value')})`
                    : '--'}
                </td>
              </tr>

              <tr className='uk-table-middle'>
                <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                  Most comments by....
                </td>
                <td id='mostCommenter' className='uk-width-4-10 uk-text-right  uk-text-small'>
                  {mostCommenter
                    ? `${mostCommenter.get(
                        'name'
                      )} (${mostCommenter.get('value')})`
                    : '--'}
                </td>
              </tr>

              <tr className='uk-table-middle'>
                <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                  Most assigned support user....
                </td>
                <td id='mostAssignee' className='uk-width-4-10 uk-text-right  uk-text-small'>
                  {mostAssignee
                    ? `${mostAssignee.get(
                        'name'
                      )} (${mostAssignee.get('value')})`
                    : '--'}
                </td>
              </tr>

              <tr className='uk-table-middle'>
                <td className='uk-width-6-10 uk-text-nowrap uk-text-muted uk-text-small'>
                  Most active ticket...
                </td>
                <td className='uk-width-4-10 uk-text-right  uk-text-small'>
                  <Link
                    id='mostActiveTicket'
                    to={`/tickets/${mostActiveTicket?.get('uid')}`}
                  >
                    {mostActiveTicket
                      ? `T#${mostActiveTicket.get('uid')}`
                      : '--'}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      }
    />
  )
}

DashboardQuickStats.propTypes = {
  mostRequester: PropTypes.object,
  mostCommenter: PropTypes.object,
  mostAssignee: PropTypes.object,
  mostActiveTicket: PropTypes.object
}

export default DashboardQuickStats
