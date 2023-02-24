/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/22/19 4:14 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment, createRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AssigneeDropdownPartial from 'containers/Tickets/AssigneeDropdownPartial';
import PDropdownTrigger from 'components/PDropdown/PDropdownTrigger';
import { makeObservable, observable } from 'mobx';
import { TICKETS_ASSIGNEE_SET, TICKETS_ASSIGNEE_LOAD, TICKETS_ASSIGNEE_CLEAR } from 'serverSocket/socketEventConsts';

import helpers from 'lib/helpers';

class RefAssignee extends React.Component {
  assigneeDropdownPartial = createRef();
  constructor(props) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {}

  componentDidUpdate() {
    // if (prevProps.ticketId !== this.props.ticketId) this.ticketId = this.props.ticketId
    // if (prevProps.status !== this.props.status) this.status = this.props.status
    // if (prevProps.owner !== this.props.owner) this.owner = this.props.owner
    // if (prevProps.subject !== this.props.subject) this.subject = this.props.subject
    // if (prevProps.issue !== this.props.issue) this.issue = this.props.issue
    // if (prevProps.attachments !== this.props.attachments) this.attachments = this.props.attachments
  }

  componentWillUnmount() {}

  render() {
    const ticket = this.props.ticket;
    return (
      <div className="ticket-details-wrap uk-position-relative uk-clearfix">
        <div className="ticket-assignee-wrap-list uk-clearfix" style={{ paddingRight: 30 }}>
          <div className="ticket-assignee uk-clearfix">
            {ticket && ticket.get('status') !== 3 && helpers.canUser('tickets:update') && (
              <span
                role="button"
                title="Set Assignee"
                style={{ float: 'left' }}
                className="relative no-ajaxy"
                onClick={() => this.props.socket.emit(TICKETS_ASSIGNEE_LOAD)}
              >
                <PDropdownTrigger target={this.assigneeDropdownPartial}>
                  <span>{this.props.assignee}</span>
                </PDropdownTrigger>
              </span>
            )}
          </div>

          {ticket && ticket.get('status') !== 3 && helpers.canUser('tickets:update') && (
            <AssigneeDropdownPartial
              forwardedRef={this.assigneeDropdownPartial}
              ticketId={ticket.get('_id')}
              topOffset={10}
              // onClearClick={() => (this.ticket.assignee = undefined)}
              // onAssigneeClick={({ agent }) => (this.ticket.assignee = agent)}
            />
          )}
        </div>
      </div>
    );
  }
}

RefAssignee.propTypes = {
  ticketStatus: PropTypes.number.isRequired,
  ticketSubject: PropTypes.string.isRequired,
  comment: PropTypes.object.isRequired,
  dateFormat: PropTypes.string.isRequired,
  isNote: PropTypes.bool.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
};

RefAssignee.defaultProps = {
  isNote: false,
};

const mapStateToProps = (state) => ({
  socket: state.shared.socket,
  settings: state.settings.settings,
  sessionUser: state.shared.sessionUser,
});

export default connect(mapStateToProps, {})(RefAssignee);
