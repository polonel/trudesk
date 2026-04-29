import React from 'react'
import PropTypes from 'prop-types'
import TruCard from 'components/TruCard'
import moment from 'moment-timezone'
import helpers from 'lib/helpers'

const DashboardTickets = ({ overdueTickets }) => {
  // Convert Immutable.js object to array if needed
  const ticketsArray = Array.isArray(overdueTickets) ? overdueTickets : overdueTickets?.toArray() || []
  
  return (
    <TruCard
      style={{ minHeight: 250 }}
      header={
        <div className='uk-text-left'>
          <h6 style={{ padding: 15, margin: 0, fontSize: '14px' }}>Overdue Tickets</h6>
        </div>
      }
      content={
        <div className='uk-overflow-container'>
          <table className='uk-table'>
            <thead>
              <tr>
                <th className='uk-text-nowrap'>Ticket</th>
                <th className='uk-text-nowrap'>Status</th>
                <th className='uk-text-nowrap'>Subject</th>
                <th className='uk-text-nowrap uk-text-right'>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {ticketsArray.map(ticket => {
                return (
                  <tr key={ticket.get('_id')} className={'uk-table-middle'}>
                    <td className={'uk-width-1-10 uk-text-nowrap'}>
                      <a href={`/tickets/${ticket.get('uid')}`}>T#{ticket.get('uid')}</a>
                    </td>
                    <td className={'uk-width-1-10 uk-text-nowrap'}>
                      <span className={'uk-badge ticket-status-open uk-width-1-1 ml-0'}>Open</span>
                    </td>
                    <td className={'uk-width-6-10'}>{ticket.get('subject')}</td>
                    <td className={'uk-width-2-10 uk-text-right uk-text-muted uk-text-small'}>
                      {moment
                        .utc(ticket.get('updated'))
                        .tz(helpers.getTimezone())
                        .format(helpers.getShortDateFormat())}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }
    />
  )
}

DashboardTickets.propTypes = {
  overdueTickets: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object // For Immutable.js objects
  ]).isRequired
}

export default DashboardTickets
