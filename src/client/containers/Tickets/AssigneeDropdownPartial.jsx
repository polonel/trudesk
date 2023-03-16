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

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';

import { TICKETS_ASSIGNEE_LOAD, TICKETS_ASSIGNEE_SET, TICKETS_ASSIGNEE_CLEAR } from 'serverSocket/socketEventConsts';

import Avatar from 'components/Avatar/Avatar';
import PDropDown from 'components/PDropdown';

import helpers from 'lib/helpers';

@observer
class AssigneeDropdownPartial extends React.Component {
  @observable agents = [];

  constructor(props) {
    super(props);
    makeObservable(this);

    this.state = {
      isHovering: false,
    };

    this.onUpdateAssigneeList = this.onUpdateAssigneeList.bind(this);
  }

  componentDidMount() {
    this.props.socket.on(TICKETS_ASSIGNEE_LOAD, this.onUpdateAssigneeList);
  }

  componentWillUnmount() {
    this.props.socket.off(TICKETS_ASSIGNEE_LOAD, this.onUpdateAssigneeList);
  }

  onUpdateAssigneeList(data) {
    this.agents = data || [];
  }

  render() {
    let topOffset;
    if (this.props.topOffset) {
      topOffset = this.props.topOffset;
    } else topOffset = 75;

    return (
      <PDropDown
        ref={this.props.forwardedRef}
        title={'Select Assignee'}
        id={'assigneeDropdown'}
        className={'opt-ignore-notice'}
        override={true}
        leftArrow={true}
        topOffset={topOffset}
        leftOffset={35}
        minHeight={215}
        rightComponent={
          <a
            className={'hoverUnderline no-ajaxy'}
            onClick={() => {
              helpers.hideAllpDropDowns();
              if (this.props.onClearClick) this.props.onClearClick();
              this.props.socket.emit(TICKETS_ASSIGNEE_CLEAR, this.props.ticketId);
            }}
          >
            Clear Assignee
          </a>
        }
      >
        {this.agents.map((agent) => {
          return (
            <li
              id="assigneeDropdown"
              key={agent._id}
              onClick={() => {
                console.log('change assignee');
                if (this.props.ticketAssigneeId != agent._id) {
                  if (this.props.onAssigneeClick) {
                    this.props.onAssigneeClick({ agent });
                    helpers.hideAllpDropDowns();
                    this.props.socket.emit(TICKETS_ASSIGNEE_SET, { _id: agent._id, ticketId: this.props.ticketId });
                  } else {
                    helpers.hideAllpDropDowns();
                    this.props.socket.emit(TICKETS_ASSIGNEE_SET, { _id: agent._id, ticketId: this.props.ticketId });
                  }
                }
              }}
            >
              <a id="assigneeDropdown" className="messageNotification no-ajaxy" role="button">
                <div id="assigneeDropdown" className="uk-clearfix">
                  <Avatar id="assigneeDropdown" userId={agent._id} image={agent.image} size={50} />
                  <div id="assigneeDropdown" className="messageAuthor">
                    <strong id="assigneeDropdown">{agent.fullname}</strong>
                  </div>
                  <div id="assigneeDropdown" className="messageSnippet">
                    <span>{agent.email}</span>
                  </div>
                  <div id="assigneeDropdown" className="messageDate">
                    {agent.title}
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </PDropDown>
    );
  }
}

AssigneeDropdownPartial.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onClearClick: PropTypes.func,
  onAssigneeClick: PropTypes.func,
  socket: PropTypes.object.isRequired,
  forwardedRef: PropTypes.any.isRequired,
};

const mapStateToProps = (state) => ({
  socket: state.shared.socket,
});

export default connect(mapStateToProps, {}, null, { forwardRef: true })(AssigneeDropdownPartial);
