/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/23/19 1:25 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import Avatar from 'components/Avatar/Avatar'
import PDropDown from 'components/PDropdown'

import helpers from 'lib/helpers'
import socket from 'lib/socket'

@observer
class AssigneeDropdownPartial extends React.Component {
  @observable agents = []

  constructor (props) {
    super(props)

    this.onUpdateAssigneeList = this.onUpdateAssigneeList.bind(this)
  }

  componentDidMount () {
    socket.socket.on('updateAssigneeList', this.onUpdateAssigneeList)
  }

  componentWillUnmount () {
    socket.socket.off('updateAssigneeList', this.onUpdateAssigneeList)
  }

  onUpdateAssigneeList (data) {
    this.agents = data || []
  }

  render () {
    return (
      <PDropDown
        title={'Select Assignee'}
        id={'assigneeDropdown'}
        override={true}
        leftArrow={true}
        topOffset={125}
        leftOffset={35}
        minHeight={215}
        rightComponent={
          <a
            className={'hoverUnderline no-ajaxy'}
            onClick={() => {
              helpers.hideAllpDropDowns()
              if (this.props.onClearClick) this.props.onClearClick()
              socket.socket.emit('clearAssignee', this.props.ticketId)
            }}
          >
            Clear Assignee
          </a>
        }
      >
        {this.agents.map(agent => {
          return (
            <li
              key={agent._id}
              onClick={() => {
                if (this.props.onAssigneeClick) this.props.onAssigneeClick({ agent })
                helpers.hideAllpDropDowns()
                socket.socket.emit('setAssignee', { _id: agent._id, ticketId: this.props.ticketId })
              }}
            >
              <a className='messageNotification no-ajaxy' role='button'>
                <div className='uk-clearfix'>
                  <Avatar userId={agent._id} image={agent.image} size={50} />
                  <div className='messageAuthor'>
                    <strong>{agent.fullname}</strong>
                  </div>
                  <div className='messageSnippet'>
                    <span>{agent.email}</span>
                  </div>
                  <div className='messageDate'>{agent.title}</div>
                </div>
              </a>
            </li>
          )
        })}
      </PDropDown>
    )
  }
}

AssigneeDropdownPartial.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onClearClick: PropTypes.func,
  onAssigneeClick: PropTypes.func
}

export default AssigneeDropdownPartial
