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

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { TICKETS_ASSIGNEE_LOAD, TICKETS_ASSIGNEE_SET, TICKETS_ASSIGNEE_CLEAR } from 'serverSocket/socketEventConsts'

import Avatar from 'components/Avatar/Avatar'
import PDropDown from 'components/PDropdown'

import helpers from 'lib/helpers'

function AssigneeDropdownPartial ({ ticketId, onClearClick, onAssigneeClick, socket, forwardedRef }) {
  const [agents, setAgents] = useState([])

  useEffect(() => {
    const onUpdateAssigneeList = data => setAgents(data || [])
    socket.on(TICKETS_ASSIGNEE_LOAD, onUpdateAssigneeList)
    return () => socket.off(TICKETS_ASSIGNEE_LOAD, onUpdateAssigneeList)
  }, [socket])

  return (
    <PDropDown
      ref={forwardedRef}
      title={'Select Assignee'}
      id={'assigneeDropdown'}
      className={'opt-ignore-notice'}
      override={true}
      leftArrow={true}
      topOffset={75}
      leftOffset={35}
      minHeight={215}
      rightComponent={
        <a
          className={'hoverUnderline no-ajaxy'}
          onClick={() => {
            helpers.hideAllpDropDowns()
            if (onClearClick) onClearClick()
            socket.emit(TICKETS_ASSIGNEE_CLEAR, ticketId)
          }}
        >
          Clear Assignee
        </a>
      }
    >
      {agents.map(agent => (
        <li
          key={agent._id}
          onClick={() => {
            if (onAssigneeClick) onAssigneeClick({ agent })
            helpers.hideAllpDropDowns()
            socket.emit(TICKETS_ASSIGNEE_SET, { _id: agent._id, ticketId })
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
      ))}
    </PDropDown>
  )
}

AssigneeDropdownPartial.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onClearClick: PropTypes.func,
  onAssigneeClick: PropTypes.func,
  socket: PropTypes.object.isRequired,
  forwardedRef: PropTypes.any.isRequired
}

const mapStateToProps = state => ({
  socket: state.shared.socket
})

export default connect(mapStateToProps, {}, null, { forwardRef: true })(AssigneeDropdownPartial)
