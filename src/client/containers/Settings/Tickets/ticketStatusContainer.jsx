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
 *  Updated:    6/20/23 3:39 PM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import SplitSettingsPanel from 'components/Settings/SplitSettingsPanel'
import Button from 'components/Button'

import $ from 'jquery'
import axios from 'axios'
import helpers from 'lib/helpers'
import TicketStatusBody from 'containers/Settings/Tickets/ticketStatusBody'

@observer
class TicketStatusContainer extends React.Component {
  onCreateStatusClicked (e) {
    console.log(e)
  }

  onStatusOrderChanged (e) {
    const children = $(e.target).children('li')
    const arr = []
    for (let i = 0; i < children.length; i++) arr.push($(children[i]).attr('data-key'))

    axios
      .put('/api/v2/tickets/status/order', { order: arr })
      .then(res => {
        console.log(res)
      })
      .catch(err => {
        console.log(err)
        helpers.UI.showSnackbar(err.message || err.response?.statusText, true)
      })
  }

  render () {
    return (
      <div>
        <SplitSettingsPanel
          title={'Ticket Status'}
          subtitle={'Ticket status sets the state of a ticket. (Active, Pending, Resolved, etc.)'}
          rightComponent={
            <Button
              text={'Create'}
              style={'success'}
              flat={true}
              waves={true}
              onClick={e => this.onCreateStatusClicked(e)}
            />
          }
          menuItems={
            this.props.statuses
              ? this.props.statuses.map(status => {
                  return {
                    key: status.get('_id'),
                    title: status.get('name'),
                    content: (
                      <div>
                        <h3 style={{ display: 'inline-block' }}>{status.get('name')}</h3>
                        <span
                          style={{
                            display: 'inline-block',
                            marginLeft: 5,
                            width: 10,
                            height: 10,
                            background: status.get('htmlColor'),
                            borderRadius: 3
                          }}
                        />
                      </div>
                    ),
                    bodyComponent: <TicketStatusBody status={status} />
                  }
                })
              : []
          }
          menuDraggable={true}
          menuOnDrag={e => this.onStatusOrderChanged(e)}
        ></SplitSettingsPanel>
      </div>
    )
  }
}

TicketStatusContainer.propTypes = {
  statuses: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, {})(TicketStatusContainer)
